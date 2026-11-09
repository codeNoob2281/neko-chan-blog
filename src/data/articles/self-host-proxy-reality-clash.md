想要一个自己的翻墙节点，第一反应是搭个 SOCKS5——简单、通用、十分钟就能上线。事实证明它也确实只活了几分钟：明文协议在审查链路上是裸奔的，上线即被探测，探测即被封。这篇记录最终方案怎么搭、为什么这样搭，以及部署完之后我对「代理到底安不安全」的重新思考。全文命令在 Debian 12 上真跑通过，所有 IP、UUID、密钥均为占位符，动手时换成自己生成的即可。

## 一、第一版为什么翻车

先交代弃用方案，一段带过。

第一版是 Dante（SOCKS5）和 Squid（HTTP）的明文代理。结果两条都很一致：

- 明文 SOCKS5 上线后约 1~2 分钟，客户端开始 TCP 层超时，服务器 tcpdump 抓包**一个 SYN 都收不到**——链路被中间设备掐断，不是服务器的问题；
- 换 HTTP 代理后，服务器日志 30 秒内出现大量陌生 IP 的请求，还带着正确的账号密码去访问一批敏感新闻站和 IP 查询站——这是教科书级的主动探测指纹识别。根因是 HTTP 代理的 `CONNECT` 请求里主机名是明文的，链路设备能直接看到你要访问什么，账号密码也是 Base64 裸奔。

结论：明文协议在审查环境下活不过几分钟，调优是浪费时间，直接换加密 + 抗探测的协议。

## 二、最终方案

服务端 sing-box 跑两条线：

- **VLESS-Reality**（TCP 443，主）：握手伪装成访问 `www.microsoft.com` 的 Chrome 浏览器。主动探测会被引导到真实的微软网站——探测者自己都看不出这是代理。最大优点是**不需要域名、不需要买证书**；
- **Hysteria2**（UDP 8443，备）：基于 QUIC，抗丢包，TCP 被劣化时的备用路线。

客户端 Clash Verge（内核 mihomo）通过**订阅链接**导入，配置集中放在服务器上，以后改节点、换密码只需要更新一份 YAML。

## 三、安装 sing-box 并生成密钥

```bash
TAG=$(curl -fsSL https://api.github.com/repos/SagerNet/sing-box/releases/latest \
      | grep -m1 '"tag_name"' | cut -d'"' -f4)
VER=${TAG#v}

cd /tmp
curl -fsSL -o sb.tar.gz \
  "https://github.com/SagerNet/sing-box/releases/download/${TAG}/sing-box-${VER}-linux-amd64.tar.gz"
tar -xzf sb.tar.gz
install -m 755 /tmp/sing-box-${VER}-linux-amd64/sing-box /usr/local/bin/sing-box

mkdir -p /etc/sing-box
sing-box generate reality-keypair > /etc/sing-box/reality.key
PRIV=$(grep -i PrivateKey /etc/sing-box/reality.key | awk '{print $2}')
PUB=$(grep -i PublicKey /etc/sing-box/reality.key | awk '{print $2}')
UUID=$(sing-box generate uuid)
SID=$(sing-box generate rand --hex 8)
HY2PASS=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | cut -c1-20)

cat > /etc/sing-box/nodes.env <<EOF
PRIV=$PRIV
PUB=$PUB
UUID=$UUID
SID=$SID
HY2PASS=$HY2PASS
EOF
chmod 600 /etc/sing-box/nodes.env
```

密钥、UUID、short_id 全部脚本生成，别手抄——后面客户端配置要用的就是这几个值。

## 四、服务端配置

Hysteria2 需要一张自签证书（客户端配 `skip-cert-verify` 即可，加密强度不受影响）：

```bash
openssl req -x509 -newkey rsa:2048 -nodes -days 3650 \
  -keyout /etc/sing-box/hy2.key -out /etc/sing-box/hy2.crt \
  -subj "/CN=www.bing.com" -addext "subjectAltName=DNS:www.bing.com"
```

主配置 `/etc/sing-box/config.json`：

```json
{
  "log": { "level": "warn", "timestamp": true },
  "dns": {
    "servers": [
      { "type": "udp", "tag": "cf", "server": "1.1.1.1" },
      { "type": "udp", "tag": "google", "server": "8.8.8.8" }
    ]
  },
  "inbounds": [
    {
      "type": "vless",
      "tag": "vless-reality",
      "listen": "::",
      "listen_port": 443,
      "users": [
        { "uuid": "<你的UUID>", "flow": "xtls-rprx-vision" }
      ],
      "tls": {
        "enabled": true,
        "server_name": "www.microsoft.com",
        "reality": {
          "enabled": true,
          "handshake": { "server": "www.microsoft.com", "server_port": 443 },
          "private_key": "<你的PrivateKey>",
          "short_id": [ "<你的short_id>" ]
        }
      }
    },
    {
      "type": "hysteria2",
      "tag": "hysteria2",
      "listen": "::",
      "listen_port": 8443,
      "users": [
        { "name": "neko", "password": "<你的HY2密码>" }
      ],
      "tls": {
        "enabled": true,
        "server_name": "www.bing.com",
        "alpn": [ "h3" ],
        "certificate_path": "/etc/sing-box/hy2.crt",
        "key_path": "/etc/sing-box/hy2.key"
      }
    }
  ],
  "outbounds": [
    { "type": "direct", "tag": "direct" },
    { "type": "block", "tag": "block" }
  ],
  "route": {
    "default_domain_resolver": "cf",
    "rules": [
      { "action": "sniff" },
      { "protocol": "dns", "action": "hijack-dns" }
    ]
  }
}
```

systemd 托管：

```bash
sing-box check -c /etc/sing-box/config.json   # 无输出即通过

cat > /etc/systemd/system/sing-box.service <<'EOF'
[Unit]
Description=sing-box service
After=network.target nss-lookup.target

[Service]
ExecStart=/usr/local/bin/sing-box run -c /etc/sing-box/config.json
Restart=on-failure
RestartSec=3
LimitNOFILE=1000000
AmbientCapabilities=CAP_NET_ADMIN CAP_NET_BIND_SERVICE CAP_NET_RAW

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now sing-box
```

## 五、服务端回环自测

强烈建议别跳过：在服务器上跑一个临时客户端实例连自己的 443，把「配置写错」和「链路被墙」两类问题先分开——后续排障省一半时间。

```bash
source /etc/sing-box/nodes.env
cat > /tmp/vless.json <<EOF
{
  "log": { "level": "error" },
  "dns": { "servers": [ { "type": "udp", "tag": "dns", "server": "1.1.1.1" } ] },
  "inbounds": [ { "type": "socks", "listen": "127.0.0.1", "listen_port": 11180 } ],
  "outbounds": [ {
    "type": "vless", "server": "127.0.0.1", "server_port": 443,
    "uuid": "${UUID}", "flow": "xtls-rprx-vision",
    "tls": { "enabled": true, "server_name": "www.microsoft.com",
      "utls": { "enabled": true, "fingerprint": "chrome" },
      "reality": { "enabled": true, "public_key": "${PUB}", "short_id": "${SID}" } }
  } ],
  "route": { "final": "out" }
}
EOF
sing-box run -c /tmp/vless.json &
sleep 3
curl -s --socks5-hostname 127.0.0.1:11180 https://ipinfo.io/ip
# 输出服务器公网 IP 即为成功，测完 kill 掉
```

## 六、订阅 YAML

Clash Verge 的订阅就是一个 YAML。VLESS-Reality 节点写法的关键字段：`flow`、`servername`、`reality-opts`、`client-fingerprint`，少一个都连不上：

```yaml
port: 7890
mixed-port: 7892
allow-lan: false
mode: rule
log-level: info
unified-delay: true
tcp-concurrent: true
global-client-fingerprint: chrome

dns:
  enable: true
  enhanced-mode: fake-ip
  fake-ip-range: 198.18.0.1/16
  default-nameserver: [223.5.5.5, 119.29.29.29]
  nameserver: ['https://doh.pub/dns-query', 'https://dns.alidns.com/dns-query']

proxies:
  - name: "节点-Reality"
    type: vless
    server: <你的服务器IP>
    port: 443
    uuid: <你的UUID>
    network: tcp
    udp: true
    tls: true
    flow: xtls-rprx-vision
    servername: www.microsoft.com
    client-fingerprint: chrome
    reality-opts:
      public-key: <你的公钥>
      short-id: <你的short_id>

  - name: "节点-Hysteria2"
    type: hysteria2
    server: <你的服务器IP>
    port: 8443
    password: <你的HY2密码>
    udp: true
    sni: www.bing.com
    skip-cert-verify: true
    alpn: [h3]

proxy-groups:
  - name: "PROXY"
    type: select
    proxies: ["AUTO", "节点-Reality", "节点-Hysteria2", "DIRECT"]
  - name: "AUTO"
    type: url-test
    url: http://www.gstatic.com/generate_204
    interval: 300
    tolerance: 100
    proxies: ["节点-Reality", "节点-Hysteria2"]

rules:
  - DOMAIN-SUFFIX,cn,DIRECT
  - DOMAIN-SUFFIX,bilibili.com,DIRECT
  - IP-CIDR,127.0.0.0/8,DIRECT,no-resolve
  - IP-CIDR,10.0.0.0/8,DIRECT,no-resolve
  - IP-CIDR,172.16.0.0/12,DIRECT,no-resolve
  - IP-CIDR,192.168.0.0/16,DIRECT,no-resolve
  - GEOIP,CN,DIRECT
  - MATCH,PROXY
```

直连规则按自己的上网习惯增删（公司内网域名、常玩游戏的服务器等都值得加进去）。

## 七、订阅服务

一个 Python 内置 HTTP 服务就够，关键是**文件名用长随机 token**，别让人猜到：

```bash
TOKEN=$(openssl rand -hex 16)
mkdir -p /var/www/clash
cp /path/to/neko-sub.yaml /var/www/clash/${TOKEN}.yaml

cat > /etc/systemd/system/neko-sub.service <<'EOF'
[Unit]
Description=clash subscription server
After=network.target

[Service]
ExecStart=/usr/bin/python3 -m http.server 8080 --bind 0.0.0.0 --directory /var/www/clash
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload && systemctl enable --now neko-sub
```

最终订阅链接形如 `http://<服务器IP>:8080/<32位token>.yaml`。Clash Verge →「订阅」→ 新建 → 粘贴 → 导入 → 打开系统代理，完事。验证方式：浏览器开 ipinfo.io，显示服务器 IP 即成功。手机端（Clash Meta for Android / FlClash / Stash / Shadowrocket）粘贴同一个链接即可。

## 八、这套代理安全吗？——部署完之后的思考

搭完实测可用之后，我把整条链路拆开重新审视了一遍。「加密」和「安全」是两件事，值得分开说。

### 链路逐段看

| 段 | 传输 | 状态 |
|---|---|---|
| 我 → 服务器（Reality） | TLS 1.3 / TCP 443 | 强加密，握手伪装成访问微软的 Chrome |
| 我 → 服务器（Hysteria2） | QUIC (TLS 1.3) / UDP 8443 | 强加密；自签证书只影响身份验证，不影响加密强度 |
| 订阅链接拉取 | HTTP 8080 | 明文，链路上唯一裸奔的一段（一次性动作） |
| 服务器 → 目标网站 | 按目标站自身协议 | HTTPS 站照常端到端加密 |

链路上审查设备看到的 Reality 流量：一段发往某个境外 IP 443 端口的、指纹与正常 Chrome 访问微软网站完全一致的 TLS 流量。看不到域名、看不到协议、内容不可读。

### 加密 ≠ 隐身

这是部署完我才真正想通的一点。GFW 虽然读不懂内容，但**元数据是暴露的**：和某个境外 IP 之间存在长期、大流量的加密通信，时间、频率、流量大小都看得见。Reality 的意义在于让主动探测无法确认「这就是代理」，降低被封的概率——但它不是绝对隐身。换句话说，方案提高的是存活期，不是匿名性。

### 两个具体的薄弱点

1. **Hysteria2 是双节点里较弱的一环**：`skip-cert-verify: true` 意味着客户端不验证服务器证书，理论上存在被中间人冒充的可能（虽然现实中很少见）。所以我把 Reality 设为首选，Hy2 只当备用——两个节点里至少有一个是完整信任链的。
2. **订阅拉取走明文 HTTP**：改配置时链路上能看见 YAML 内容。对策是 token 够长（32 位随机十六进制）、链接当密码对待，更稳妥的做法是直接把文件发给设备本地导入。

### 服务器是「中间人」——这是所有代理的共同性质

访问 HTTPS 网站时，代理只能看到你连了哪个域名（SNI），看不到密码、Cookie、聊天内容——那是网站自己的端到端 TLS；访问明文 HTTP 站点时，代理和 VPS 商家理论上都能看到内容。所以「你信任的不是加密，而是这台服务器的管理员」——好在这台机的管理员是我自己，日志级别也只开到 `warn`，不留访问记录。

### 结论

防内容窥探（GFW/ISP）：强加密，没问题；防主动探测：Reality 是当前民用方案里最强的；防服务器商家看元数据：任何代理都做不到，这是代理的工作原理决定的。日常查资料、上 GitHub、看文档完全够用；要跑银行等高危操作，别对线路抱有超出它能力范围的期待。

## 九、踩坑回顾

1. **明文协议会被秒级探测**，别浪费时间调优，直接上 Reality；
2. **sing-box 1.14 改了 DNS 配置格式**：旧的 `{"tag": "cf", "address": "1.1.1.1"}` 直接报错，必须写 `{"type": "udp", "tag": "cf", "server": "1.1.1.1"}`，同时 `route` 里要加 `default_domain_resolver`——老教程照抄必炸，服务起不来九成是这两处；
3. **Reality 伪装域名要选支持 TLS 1.3 + H2 且没被墙的大站**，`www.microsoft.com` 稳妥；选个被墙域名等于自我暴露；
4. **short_id 是 16 位十六进制**，客户端与服务端必须逐字符一致；
5. **服务端先回环自测**，把配置错误和网络封锁分开查；
6. **订阅文件名上随机 token**，链接当密码对待。

## 十、维护备忘

- 换密码：改 `nodes.env` 和 `config.json` 后 `systemctl restart sing-box`，同步更新订阅 YAML；
- 查异常：`ss -tnp | grep :443` 看连接数，`journalctl -u sing-box -f` 看实时日志；
- 节点被墙的信号：能 ping 通但握手超时 → 先换 Reality 伪装域名，再考虑换端口（80 / 2053 这类「网站端口」比高位端口耐造）。

一次部署、两套协议、一个订阅链接，之后所有设备都是粘贴即用。从「上线即死」到稳定可用，中间差的不是运维技巧，是选对协议。
