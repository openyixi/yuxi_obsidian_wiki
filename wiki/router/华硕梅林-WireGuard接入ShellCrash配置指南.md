---
tags:
  - 网络
  - WireGuard
  - ShellCrash
  - Asuswrt-Merlin
  - 路由器
created: 2026-10-08
updated: 2026-10-08
---

# 华硕梅林 WireGuard 接入 ShellCrash 配置指南

新增更多设备时，请同时参考：[[WireGuard新增客户端操作手册]]。

密钥生成、服务端与客户端公钥对应关系，以及手动填写配置的方法，也记录在该操作手册的“密钥分别放在哪里”章节中。

> [!warning] 安全提示
> 本文不保存 WireGuard 私钥、预共享密钥、机场订阅地址或 SSH 私钥。客户端配置和二维码都属于敏感凭据，不要上传到公开仓库、网盘或聊天群。

## 1. 目标

让外部设备通过 WireGuard 连接家中的华硕路由器，同时实现：

1. 访问华硕路由器及家庭局域网设备；
2. 所有 IPv4 流量进入 WireGuard；
3. 避免 iPhone 的 IPv6 流量绕过隧道；
4. WireGuard 客户端自动进入 ShellCrash 透明代理；
5. 后续新增客户端时，不必逐个修改 ShellCrash 防火墙规则。

## 2. 当前网络拓扑

```text
互联网
  │
  ▼
华为主路由 192.168.30.1
  │  UDP 51820 端口转发
  ▼
华硕 RT-AX86U Pro
  ├─ WAN：192.168.30.248（当前观察值，建议在主路由中固定租约）
  ├─ LAN：192.168.50.1/24
  ├─ WireGuard：192.168.201.1/32
  └─ ShellCrash：TCP 7892，DNS 1053
       ├─ iPhone：192.168.201.2/32
       └─ Mac：192.168.201.3/32
```

公网连接入口：

```text
openyixi.openyixi.top:51820
```

## 3. 地址规划

| 地址或网段 | 用途 |
| --- | --- |
| `192.168.30.0/24` | 华为主路由网络 |
| `192.168.50.0/24` | 华硕 LAN 网络 |
| `192.168.201.0/24` | WireGuard 客户端地址池 |
| `192.168.201.1` | 华硕 WireGuard 服务端 |
| `192.168.201.2` | iPhone |
| `192.168.201.3` | Mac |

每个 WireGuard 客户端必须使用独立 IP 和独立密钥，不能复制另一个设备的完整配置。

## 4. 主路由端口转发

华硕是二级路由器，公网 WireGuard 数据包必须先经过华为主路由。

1. 登录华为主路由 `http://192.168.30.1/`。
2. 给华硕 WAN 网卡设置 DHCP 固定租约，避免 WAN 地址变化。
3. 新建端口转发：

| 项目 | 值 |
| --- | --- |
| 名称 | `ASUS-WIREGUARD` |
| 协议 | UDP |
| 外部端口 | `51820` |
| 内部主机 | 华硕 WAN 地址，当前为 `192.168.30.248` |
| 内部端口 | `51820` |

> [!important]
> WireGuard 使用 UDP。只转发 TCP 51820 是无效的。如果以后修改了华硕 WAN 地址，必须同步修改端口转发。

## 5. 在华硕路由器开启 WireGuard 服务端

1. 登录华硕：`http://192.168.50.1/`。
2. 进入“高级设置 → VPN → VPN 服务器 → WireGuard”。
3. 创建或启用服务端，建议参数：

| 参数 | 值 |
| --- | --- |
| 服务端地址 | `192.168.201.1/32` |
| 监听端口 | `51820` |
| 允许访问内部网络 | 是 |
| DNS | 路由器，即 `192.168.201.1` |

4. 保存并应用。

## 6. 新增客户端

### 6.1 iPhone

在 WireGuard 服务端中新增客户端：

| 参数 | 值 |
| --- | --- |
| 名称 | `Remote-Client-1` 或 `iPhone` |
| 客户端地址 | `192.168.201.2/32` |
| 服务端允许的客户端 IP | `192.168.201.2/32` |
| 客户端允许的目标网络 | `0.0.0.0/0` |

导出后检查客户端配置，必须把对端地址改成公网域名：

```ini
[Interface]
PrivateKey = <iPhone 独立私钥>
Address = 192.168.201.2/32
DNS = 192.168.201.1

[Peer]
PublicKey = <华硕 WireGuard 服务端公钥>
AllowedIPs = 0.0.0.0/0, ::/0
Endpoint = openyixi.openyixi.top:51820
PersistentKeepalive = 25
```

### 6.2 Mac

新增第二个客户端：

| 参数 | 值 |
| --- | --- |
| 名称 | `Remote-Mac` 或 `Mac` |
| 客户端地址 | `192.168.201.3/32` |
| 服务端允许的客户端 IP | `192.168.201.3/32` |
| 客户端允许的目标网络 | `0.0.0.0/0` |

Mac 客户端配置结构：

```ini
[Interface]
PrivateKey = <Mac 独立私钥>
Address = 192.168.201.3/32
DNS = 192.168.201.1

[Peer]
PublicKey = <华硕 WireGuard 服务端公钥>
AllowedIPs = 0.0.0.0/0, ::/0
Endpoint = openyixi.openyixi.top:51820
PersistentKeepalive = 25
```

## 7. iPhone 必须注意 IPv6

如果配置只有：

```ini
AllowedIPs = 0.0.0.0/0
```

它只接管 IPv4。iOS 可能优先使用 IPv6，导致部分流量绕过 WireGuard，看起来像是“WireGuard 已连接、能访问路由器，但无法科学上网”。

应改为：

```ini
AllowedIPs = 0.0.0.0/0, ::/0
```

这会同时接管 IPv4 和 IPv6，防止 IPv6 泄漏。当前家庭出口没有完整的 WireGuard IPv6 转发时，IPv6 连接失败后应用会回退到 IPv4，再由 ShellCrash 处理。

## 8. 让整个 WireGuard 网段进入 ShellCrash

### 8.1 为什么不能只依赖自动生成规则

ShellCrash 默认可能只为当前已存在的 WireGuard peer 生成单地址规则，例如：

```text
192.168.201.2/32
192.168.201.3/32
```

以后增加 `.4`、`.5` 等客户端时，需要再次重载规则。更稳妥的方式是加入 `192.168.201.0/24` 整段规则。

### 8.2 持久化位置

ShellCrash 提供启动后任务文件：

```text
/jffs/ShellCrash/task/afstart
```

每次 ShellCrash 创建完自己的防火墙链后，会执行这个文件。不要直接修改 `starts/fw_iptables.sh` 等程序文件，升级 ShellCrash 时可能被覆盖。

修改前先备份：

```sh
cp -p /jffs/ShellCrash/task/afstart \
  /jffs/ShellCrash/task/afstart.backup-$(date +%Y%m%d-%H%M%S)
```

然后在 `/jffs/ShellCrash/task/afstart` 末尾加入：

```sh

# BEGIN CODEX-WIREGUARD-SUBNET
# Transparently proxy every WireGuard client in 192.168.201.0/24.
WG_PROXY_SUBNET="192.168.201.0/24"

iptables -t nat -C shellcrash -s "$WG_PROXY_SUBNET" -p tcp -j REDIRECT --to-ports 7892 2>/dev/null || \
  iptables -t nat -A shellcrash -s "$WG_PROXY_SUBNET" -p tcp -j REDIRECT --to-ports 7892

iptables -t nat -C shellcrash_dns -s "$WG_PROXY_SUBNET" -p tcp -j REDIRECT --to-ports 1053 2>/dev/null || \
  iptables -t nat -A shellcrash_dns -s "$WG_PROXY_SUBNET" -p tcp -j REDIRECT --to-ports 1053

iptables -t nat -C shellcrash_dns -s "$WG_PROXY_SUBNET" -p udp -j REDIRECT --to-ports 1053 2>/dev/null || \
  iptables -t nat -A shellcrash_dns -s "$WG_PROXY_SUBNET" -p udp -j REDIRECT --to-ports 1053

iptables -t mangle -C shellcrash_mark -s "$WG_PROXY_SUBNET" -p udp -j MARK --set-mark 7892 2>/dev/null || \
  iptables -t mangle -A shellcrash_mark -s "$WG_PROXY_SUBNET" -p udp -j MARK --set-mark 7892
# END CODEX-WIREGUARD-SUBNET
```

这些命令使用 `iptables -C` 先检查规则是否存在，因此重复执行不会不断添加相同规则。

### 8.3 重载 ShellCrash

```sh
/jffs/ShellCrash/start.sh restart
```

重载会造成数秒钟的代理中断。

## 9. 验证

### 9.1 检查 WireGuard

```sh
wg show wgs1
```

应看到：

- 服务端监听 UDP `51820`；
- iPhone 和 Mac 各自有独立 peer；
- 客户端连接后出现 `latest handshake`；
- `transfer` 收发字节持续增加。

检查路由：

```sh
ip route show | grep 192.168.201
```

已配置的客户端应显示类似：

```text
192.168.201.2 dev wgs1 scope link
192.168.201.3 dev wgs1 scope link
```

如果新增客户端后没有路由，可重载 WireGuard 服务：

```sh
service 'restart_wgs;1'
```

注意：这会让现有 WireGuard 客户端短暂重连。

### 9.2 检查 ShellCrash 进程和端口

```sh
pidof CrashCore
netstat -lntup | grep -E '7890|7892|1053'
```

### 9.3 检查整段网规则

```sh
iptables-save -t nat | grep '192.168.201.0/24'
iptables-save -t mangle | grep '192.168.201.0/24'
```

应看到四类规则：

1. TCP 重定向到 `7892`；
2. TCP DNS 重定向到 `1053`；
3. UDP DNS 重定向到 `1053`；
4. UDP 设置 ShellCrash 标记 `0x1ed4`。

查看命中计数：

```sh
iptables -t nat -nvL shellcrash
iptables -t nat -nvL shellcrash_dns
iptables -t mangle -nvL shellcrash_mark
```

连接客户端并浏览网页后，`192.168.201.0/24` 对应规则的包计数应增加。

### 9.4 客户端测试顺序

1. 关闭客户端 Wi-Fi，先使用蜂窝网络测试，排除局域网回环干扰；
2. 打开 WireGuard，确认状态为已连接；
3. 访问 `http://192.168.50.1/`，确认能进入华硕局域网；
4. 测试国内网站；
5. 测试 Google、YouTube 等需要代理的网站；
6. 检查出口 IP 是否符合当前 ShellCrash 节点。

## 10. 常见故障

### 10.1 能访问路由器，但不能访问外网

检查：

- 客户端 `AllowedIPs` 是否为 `0.0.0.0/0, ::/0`；
- DNS 是否为 `192.168.201.1`；
- ShellCrash 是否运行；
- `192.168.201.0/24` 规则是否存在；
- 防火墙规则计数是否增加。

### 10.2 完全没有握手

检查：

- 域名是否解析到当前公网 IP；
- Endpoint 是否为 `openyixi.openyixi.top:51820`；
- 华为主路由是否将 UDP 51820 转发到正确的华硕 WAN 地址；
- 华硕 WireGuard 服务端是否启用；
- 客户端密钥与服务端 peer 是否配对。

### 10.3 Windows 能用，iPhone 不能用

优先检查 IPv6。iPhone 配置应包含：

```ini
AllowedIPs = 0.0.0.0/0, ::/0
```

同时确保每个设备使用自己的客户端配置，不能让 Windows 和 iPhone 同时使用同一私钥和同一 WireGuard 地址。

### 10.4 新增客户端后不能访问

1. 确认新客户端地址属于 `192.168.201.0/24`；
2. 确认没有和已有客户端重复；
3. 运行 `wg show wgs1` 查看 peer；
4. 检查对应主机路由；
5. 必要时执行：

```sh
service 'restart_wgs;1'
/jffs/ShellCrash/start.sh restart
```

## 11. 回滚 ShellCrash 自定义规则

当前备份文件示例：

```text
/jffs/ShellCrash/task/afstart.backup-20261008-1355
```

恢复步骤：

```sh
cp -p /jffs/ShellCrash/task/afstart.backup-20261008-1355 \
  /jffs/ShellCrash/task/afstart
/jffs/ShellCrash/start.sh restart
```

也可以只删除 `BEGIN CODEX-WIREGUARD-SUBNET` 到 `END CODEX-WIREGUARD-SUBNET` 之间的内容，然后重启 ShellCrash。

## 12. 新增设备检查清单

- [ ] 选择未占用的 `192.168.201.x` 地址
- [ ] 在华硕 WireGuard 服务端新增 peer
- [ ] 为新设备生成独立密钥
- [ ] 客户端 DNS 设置为 `192.168.201.1`
- [ ] Endpoint 设置为 `openyixi.openyixi.top:51820`
- [ ] AllowedIPs 设置为 `0.0.0.0/0, ::/0`
- [ ] 导入配置并测试握手
- [ ] 确认家庭局域网可访问
- [ ] 确认 ShellCrash 代理可用
- [ ] 在《家庭网络 IP 地址分配》中登记 IP
