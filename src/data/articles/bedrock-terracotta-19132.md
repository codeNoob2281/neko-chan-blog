昨晚我把日志刷屏关掉了，代价写在文章末尾：基岩版列表里的 MOTD 会退回默认值。今天的问题是另一件事——日志不刷了，基岩版玩家还是进不去。

客户端给的全部线索是一句「出错啦，搜索 Terracotta」。听起来像基岩版在说「我也不知道」，于是很容易从这句话开始瞎猜：账号？版本？网络？我一开始也这么猜，猜了两轮才发现方向就错了。

## 先让客户端说出编号

现在的基岩版（26.60，协议 2225）只走 NetherNet，旧的 RakNet 通道 GeyserMC 已经从 build 1280 里删掉了。所以判断「连不上」的位置，第一件事是点开弹窗下面的 **显示详情**，看 `InitialConnection` 的编号：

| 编号 | 客户端显示 | 含义 |
| --- | --- | --- |
| 149 | Terracotta | 服务器不讲 NetherNet（还在 raknet），或信令根本不可达 |
| 83 | Door | 信令通了，UDP 过不去——端口没放行，或者服务器在 NAT 后面 |
| 13 | NetherNet | 两条通道都没回应，先看地址写对没有 |
| 122 | NetherNet | 连上了又被关掉，先去升级 Geyser |

「Terracotta 是通用未指明错误」这个说法，在 26.60 之后就不准了。它对应 `UnsupportedTransport`，而 GeyserMC 的排障 tag 里明确把它们排在一起：**服务器跑在 RakNet 上，或者 TCP 端口没开**。

一句话：Terracotta 不是「不知道」，是「我知道，但你得点开看」。

## dump 能读出包到没到门口

`geyser dump` 会把这些内部状态打包成一份可分享的诊断。我们在玩家报错那次抓到两个字段：

```
connectionAttempts: 0
netherNetInfo.nxs.addresses: ["192.168.0.2:19132"]
```

第一个字段最值钱。`connectionAttempts: 0` 意味着**一个客户端都没摸到 Geyser**，问题在门外，不在门里。于是门内两个嫌疑可以当场排除：

- 资源包：`http://62.234.151.56/dl/EnderPack.zip` 返回 200，118KB，sha1 与 `server.properties` 里写的完全一致——分发没问题。
- Geyser 到 Java 服：后来玩家进服后，控制台能看到 `Floodgate player logged in as ... joined`，这条链路也是通的。

剩下的是门外那两件小事：名片，和端口。

## 名片：`advertise-addresses` 留空会发出内网 IP

配置注释写得很客气：

```
# Leave empty to use this machine's own addresses, plus the public address found with "stun-discovery".
advertise-addresses: []
```

翻译成人话：留空就自己猜，猜的依据是本机网卡 + 向信令服务的 STUN 问一句「我在外面长什么样」。

我们的机器在 NAT 后面，这件事就脆了。实测过一次重启后 STUN 没探测成功，dump 里 `nxs.addresses` 只剩 `192.168.0.2:19132`——一台内网机器，把内网地址当名片发给了所有玩家。玩家拿这张名片当然找不到门。

改成显式地址后重启，再 dump 一次，确认内网地址不再出现。后来我们把这张名片升级成了域名：

```
bedrock:
  signaling:
    advertise-addresses:
      - mc.xt91tv.shop:19132
```

`dig` 确认它解析到公网 `103.236.77.248`。这里有个容易踩的坑，藏在同一段注释里：**主机名是在信令启动时解析的，解析不出来信令就不启动**。也就是说域名写错不会报错，只会安静地不广播——比 IP 写错更难查。

## 我误判的那个端口

昨晚我测过端口，方法是对的：往 `19132` 发 RakNet Unconnected Ping，没回应；对照组往 `19133`、`19134`、`19129`、`39999` 发同样的包，立刻收到 ICMP 端口不可达。两边一比较，结论是「19132 是开的」。

然后我顺手测了 TCP 19132，得到 RST——**连接被拒**。当时的判断是：NetherNet 的游戏数据走 UDP，TCP 打不通不影响。这句话本身没错，但它是半句。

完整的一句在 GeyserMC 的端口转发文档里：玩家**先用 TCP（信令）找到服务器，再用 UDP 在上面玩**。而 Terracotta 149 的成因里，就明明白白写着「TCP 端口关闭」。TCP 放行之后，玩家进来了。

这是一次典型的「一次通过的测试只证明那条路通」。我的对照组设计得挺干净，它证明的是「UDP 19132 没被防火墙静默丢弃」，我却把它读成了「端口没问题」。两者的差别，是一个端口和两个端口。

## 域名、SRV、小云朵、证书

域名这一段，几个结论都硬（也顺手修正了一半笔记里的说法）：

- **基岩版不查 SRV 记录**，只有 Java 版查。所以域名必须靠 A 记录直连，端口要玩家自己在地址里手打 `:19132`。折腾 SRV 是白费。
- **Cloudflare 橙云（代理）只代理 HTTP(S) 端口**，19132 的 TCP/UDP 它不转。做 Minecraft 的域名记录必须是灰云（仅 DNS），否则解析出来的是一堆 Cloudflare 的 IP。
- **有没有证书，决定走 HTTP 还是 HTTPS 信令**。没配证书时 Geyser 用 HTTP，客户端第一次连接会弹「信任此服务器」；配了证书就走 HTTPS，弹窗消失。原注释：`Players connecting over HTTPS do not see the "trust on first use" prompt.`
- 配证书**不需要**把 `signaling.mode` 改成 `builtin`。注释里写着 `builtin.https` 只在 `builtin` 和 `hybrid` 两种模式下生效，我们现在正好是 `hybrid`——也就是说可以只填证书，继续保留 NXS 的云信令，免得为了一个小弹窗把外部信令关掉。

证书自身还有两个细节：PEM 要带完整链（少了中间证书部分客户端会报错），路径是相对 Geyser 配置目录的，客户端必须用证书里那个域名连——拿 IP 连，证书对不上，照样弹窗。

## 关掉那个循环的账单

昨晚把 `integrated-ping-passthrough` 改成 `false` 之后，Geyser 并没有停止去问 MOTD，它换了个更笨的办法。翻源码，`GeyserLegacyPingPassthrough` 里是个死循环线程：每 `ping-passthrough-interval` 秒（我们配的 3 秒）真的 `new Socket()`，`socket.connect(endpoint, 5000)`，手搓一个 Java status 握手包，读回 JSON，解析成 MOTD。

所以这条警告是「关循环」的账单：

```
[Geyser] Failed to ping the remote Java server! Is it online and configured in Geyser's config?
```

它挂在 `EOFException` 分支上：TCP 连上了，但对面没回 JSON 就关了连接。它说明的是**MOTD 这条路不通**，不代表玩家进不来——玩家走的是 `use-direct-connection: true` 的直连，绕过网络直接进同一个 JVM。两条线得分开看。查 MOTD 就查地址和端口，查玩家进不来就去看 `connectionAttempts` 和客户端那个编号，别混着猜。

## 下次按这个顺序念一遍

1. 客户端**显示详情**，先拿 `InitialConnection` 编号。
2. `19132` 的 **TCP 和 UDP** 都在防火墙/安全组放行了吗？（NAT 映射要两条规则）
3. `advertise-addresses` 填的是公网地址或域名吗？解析得出来吗？
4. 域名 A 记录对了吗？小云朵关了吗？客户端地址带端口了吗？
5. 证书填了吗？PEM 全链吗？客户端用的是域名吗？
6. 改完再看一次 dump：`addresses` 是不是公网，`connectionAttempts` 有没有涨。

## 没做干净的那部分

严格说，这次是**同时动了三个变量**才通的：放行 TCP、改名片、换成域名。中间没有做过逐项对照——每改一项就重启一次生产服、再请玩家连一次，这个代价我付不起，也不能让玩家替我付。

所以我留了个问题给自己：能不能在改之前就把这三个变量各自单独验证掉？比如从公网 mock 一次信令请求、再 mock 一次 WebRTC 握手，把「TCP 通不通」「UDP 通不通」「名片对不对」拆成三个可以独立跑的探测——而不是像这次一样，攒三个变量一起改，然后从「通了」倒推是谁的功劳。

昨晚那篇文章的结尾，我写的是工具粒度不够。今天这个结尾更难受一点：工具都在手上，是方法上省了一步对照。
