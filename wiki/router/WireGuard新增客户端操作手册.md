---
tags:
  - 网络
  - WireGuard
  - 操作手册
  - IP地址管理
created: 2026-10-08
updated: 2026-10-08
---

# WireGuard 新增客户端操作手册

关联文档：

- [[华硕梅林-WireGuard接入ShellCrash配置指南]]
- [[家庭网络-IP地址分配]]

> [!warning] 一台设备一个配置
> 每台设备必须使用独立的 WireGuard IP、私钥和 peer。不要把同一个配置文件同时导入多台设备，否则它们会互相抢占连接，出现时通时断。

## 1. 当前地址分配

| 地址 | 设备 | 状态 |
| --- | --- | --- |
| `192.168.201.1` | 华硕 WireGuard 服务端 | 已占用 |
| `192.168.201.2` | iPhone | 已占用 |
| `192.168.201.3` | Mac | 已占用 |
| `192.168.201.4` 起 | 后续客户端 | 按顺序分配 |

推荐依次使用：

```text
192.168.201.4/32
192.168.201.5/32
192.168.201.6/32
……
```

不要分配：

- `192.168.201.0`：网段地址；
- `192.168.201.1`：WireGuard 服务端；
- 已经登记给其他设备的地址；
- `192.168.201.255`：广播地址。

## 2. 添加前准备

每次添加设备前记录以下信息：

| 项目 | 示例 |
| --- | --- |
| 设备名称 | `iPad`、`MacBook-Pro`、`Windows-Laptop` |
| 分配地址 | `192.168.201.4/32` |
| 添加日期 | `2026-10-08` |
| 配置保管位置 | 仅设备本机或可信加密存储 |

先打开 [[家庭网络-IP地址分配]]，确认准备使用的地址没有被占用。

## 3. 在华硕管理页面新增客户端

1. 登录华硕路由器：`http://192.168.50.1/`。
2. 进入“高级设置 → VPN → VPN 服务器”。
3. 选择当前启用的 WireGuard 服务端。
4. 点击“新增客户端”或“添加 peer”。
5. 填写：

| 参数 | 填写方法 |
| --- | --- |
| 客户端名称 | 使用能识别设备的名称，例如 `iPad` |
| 客户端地址 | 下一个空闲地址，例如 `192.168.201.4/32` |
| 服务端允许 IP | 与客户端地址相同，例如 `192.168.201.4/32` |
| 客户端允许 IP | 选择全流量，导出后再检查 |
| DNS | 使用路由器 `192.168.201.1` |

6. 应用设置。
7. 为该客户端单独导出配置文件或二维码。

> [!important]
> 华硕管理页面有时会把 Endpoint 生成为二级路由器的私网 WAN 地址，例如 `192.168.30.x:51820`。这个地址在外网无法使用，导出后必须检查并改为 `openyixi.openyixi.top:51820`。

## 4. 检查客户端配置

### 4.1 密钥分别放在哪里

WireGuard 每个参与方都有一对密钥：私钥和公钥。

| 密钥 | 保存位置 | 是否可以公开 |
| --- | --- | --- |
| 华硕服务端私钥 | 只保存在华硕路由器 | 绝对不能公开 |
| 华硕服务端公钥 | 填入客户端 `[Peer] PublicKey` | 可以提供给客户端 |
| 客户端私钥 | 填入该设备 `[Interface] PrivateKey` | 绝对不能公开 |
| 客户端公钥 | 填入华硕服务端对应 peer | 可以提供给服务端 |
| 预共享密钥 PSK | 同时填入服务端 peer 和客户端 `[Peer]` | 不能公开，可选 |

关系示意：

```text
客户端私钥 ──生成──> 客户端公钥 ──填入──> 华硕服务端 peer
服务端私钥 ──生成──> 服务端公钥 ──填入──> 客户端 [Peer]
```

公钥可以由私钥计算出来，但不能通过公钥反推出私钥。

### 4.2 推荐方法：让华硕自动生成

最简单的方法是在华硕 WireGuard 服务端页面点击“新增客户端”。华硕会自动：

1. 为客户端生成独立私钥；
2. 计算客户端公钥；
3. 把客户端公钥加入服务端 peer；
4. 生成包含客户端私钥的 `.conf` 文件和二维码。

导出后只需检查并修改以下三项：

```ini
DNS = 192.168.201.1
AllowedIPs = 0.0.0.0/0, ::/0
Endpoint = openyixi.openyixi.top:51820
```

不要手工修改 `PrivateKey` 和 `PublicKey`，除非你准备重新配对两端密钥。

### 4.3 命令行手动生成客户端密钥

需要先安装 WireGuard 工具，并确保能运行 `wg`。

在 macOS 或 Linux 中执行：

```sh
umask 077
wg genkey | tee client_private.key | wg pubkey > client_public.key
```

生成结果：

```text
client_private.key  # 客户端私钥，只填入客户端
client_public.key   # 客户端公钥，只填入华硕服务端 peer
```

查看公钥：

```sh
cat client_public.key
```

只有在本机安全环境中需要填写配置时才查看私钥：

```sh
cat client_private.key
```

Windows 安装官方 WireGuard 后，可在 PowerShell 中执行：

```powershell
$wg = 'C:\Program Files\WireGuard\wg.exe'
$privateKey = & $wg genkey
$publicKey = $privateKey | & $wg pubkey

Set-Content -LiteralPath '.\client_private.key' -Value $privateKey -NoNewline
Set-Content -LiteralPath '.\client_public.key' -Value $publicKey -NoNewline
```

生成后应妥善保护 `client_private.key`。不要截图、发聊天消息或提交到 Git。

### 4.4 可选：生成预共享密钥 PSK

WireGuard 原有公私钥已经可以安全通信。需要额外一层对称密钥时，可以生成 PSK：

```sh
umask 077
wg genpsk > client_preshared.key
```

然后在客户端 `[Peer]` 中增加：

```ini
PresharedKey = <client_preshared.key 的内容>
```

华硕服务端相应 peer 也必须填写完全相同的 PSK。只填一端会导致无法握手。

### 4.5 手动填写完整配置的顺序

假设为新设备分配 `192.168.201.4/32`：

1. 生成 `client_private.key` 和 `client_public.key`；
2. 在华硕 WireGuard 服务端新增 peer；
3. 将 `client_public.key` 的内容填入该 peer 的客户端公钥；
4. 服务端 Allowed IP 填 `192.168.201.4/32`；
5. 查询华硕服务端公钥；
6. 在客户端配置中填写客户端私钥和服务端公钥；
7. 保存并应用华硕设置；
8. 导入客户端配置进行测试。

SSH 登录华硕后，可以只查看服务端公钥：

```sh
wg show wgs1 public-key
```

不要运行或记录显示服务端私钥的命令。

完整配置模板：

```ini
[Interface]
PrivateKey = <client_private.key 的内容>
Address = 192.168.201.4/32
DNS = 192.168.201.1

[Peer]
PublicKey = <wg show wgs1 public-key 的输出>
# 使用 PSK 时才取消下一行注释
# PresharedKey = <client_preshared.key 的内容>
AllowedIPs = 0.0.0.0/0, ::/0
Endpoint = openyixi.openyixi.top:51820
PersistentKeepalive = 25
```

> [!danger] 不要把真实密钥写进 Obsidian
> 当前 Obsidian 知识库位于 Git 仓库。即使以后删除密钥，它仍可能留在 Git 历史或同步服务中。文档只保留占位符；真实配置应直接导入设备并保存在受保护的位置。

正确的配置结构如下：

```ini
[Interface]
PrivateKey = <该设备自己的私钥>
Address = 192.168.201.X/32
DNS = 192.168.201.1

[Peer]
PublicKey = <华硕 WireGuard 服务端公钥>
AllowedIPs = 0.0.0.0/0, ::/0
Endpoint = openyixi.openyixi.top:51820
PersistentKeepalive = 25
```

把 `192.168.201.X` 换成这次分配的地址。

逐项检查：

- `PrivateKey` 是新设备独有的，不能复制其他客户端的私钥；
- `Address` 没有与其他设备重复；
- `DNS = 192.168.201.1`；
- `Endpoint = openyixi.openyixi.top:51820`；
- `AllowedIPs = 0.0.0.0/0, ::/0`；
- `PersistentKeepalive = 25`。

## 5. 为什么必须包含 `::/0`

只有下面这一项时：

```ini
AllowedIPs = 0.0.0.0/0
```

WireGuard 只接管 IPv4。iPhone、iPad 和 Mac 等设备可能优先使用 IPv6，导致 IPv6 流量绕过隧道。

统一使用：

```ini
AllowedIPs = 0.0.0.0/0, ::/0
```

这样可以避免 IPv6 泄漏，并保证访问受限网站时回到 WireGuard 的 IPv4 出口。

## 6. 导入到不同设备

### iPhone / iPad

1. 安装官方 WireGuard App；
2. 点击“添加隧道”；
3. 选择“从二维码创建”或“从文件或归档创建”；
4. 给隧道起一个易识别的名字；
5. 开启隧道。

二维码包含客户端私钥。扫码完成后，不要把二维码截图发送给其他人。

### macOS

1. 安装官方 WireGuard App；
2. 点击“导入隧道”；
3. 选择该 Mac 专用的 `.conf` 文件；
4. 确认配置名称和地址；
5. 启用隧道。

### Windows

1. 安装官方 WireGuard；
2. 选择“从文件导入隧道”；
3. 导入该 Windows 设备专用的 `.conf`；
4. 激活隧道。

### Android

1. 安装官方 WireGuard；
2. 通过二维码或文件导入；
3. 开启隧道；
4. 如果系统启用了私人 DNS且出现解析问题，可暂时关闭私人 DNS进行排查。

## 7. ShellCrash 是否需要再次修改

不需要。

路由器已经配置为自动接管整个 WireGuard 网段：

```text
192.168.201.0/24
```

因此以后分配的 `192.168.201.4`、`.5`、`.6` 等地址都会自动进入 ShellCrash：

- TCP 重定向到 `7892`；
- DNS TCP/UDP 重定向到 `1053`；
- UDP 使用 ShellCrash 标记 `0x1ed4`。

只要新客户端地址仍在 `192.168.201.0/24` 内，就不需要重复添加 ShellCrash 规则。

## 8. 添加后验证

### 8.1 客户端侧

建议先关闭家庭 Wi-Fi，使用蜂窝网络或其他外部网络测试：

1. 开启 WireGuard；
2. 访问 `http://192.168.50.1/`；
3. 测试国内网站；
4. 测试 Google 或 YouTube；
5. 检查公网出口 IP 是否与 ShellCrash 当前节点一致。

### 8.2 路由器侧

SSH 登录华硕后执行：

```sh
wg show wgs1
```

检查新 peer 是否出现：

- `latest handshake` 不为空；
- `transfer` 收发字节持续增加；
- `allowed ips` 是刚分配的单个 `/32` 地址。

检查新地址的主机路由：

```sh
ip route show | grep 192.168.201
```

例如新增 `192.168.201.4` 后，应出现：

```text
192.168.201.4 dev wgs1 scope link
```

如果没有出现，可执行：

```sh
service 'restart_wgs;1'
```

该操作会让所有 WireGuard 客户端短暂重连。

检查整段 ShellCrash 规则仍然存在：

```sh
iptables-save -t nat | grep '192.168.201.0/24'
iptables-save -t mangle | grep '192.168.201.0/24'
```

## 9. 常见错误

### 地址重复

现象：一台设备连接后，另一台设备掉线或流量异常。

处理：给每台设备重新分配唯一的 `/32` 地址，并在服务端分别建立 peer。

### 多台设备共用私钥

现象：服务端认为它们是同一个 peer，Endpoint 不断在不同公网地址之间跳动。

处理：删除重复配置，为每台设备重新生成独立配置和密钥。

### 能访问路由器但不能科学上网

检查：

- `AllowedIPs` 是否包含 `::/0`；
- DNS 是否是 `192.168.201.1`；
- ShellCrash 是否在运行；
- `192.168.201.0/24` 的防火墙规则是否存在；
- 新客户端地址是否位于 `192.168.201.0/24`。

### 没有握手

检查：

- Endpoint 是否为 `openyixi.openyixi.top:51820`；
- 域名是否解析到当前公网 IP；
- 华为主路由 UDP 51820 端口转发是否仍指向华硕 WAN 地址；
- 华硕 WAN 地址是否因 DHCP 发生变化；
- WireGuard 服务端是否启用；
- 公钥是否正确配对。

## 10. 设备丢失或不再使用时

不要只在客户端关闭 WireGuard。应该登录华硕路由器：

1. 找到对应客户端 peer；
2. 核对名称和分配地址；
3. 删除或禁用该 peer；
4. 应用设置；
5. 在 [[家庭网络-IP地址分配]] 中把地址标记为已回收；
6. 如果设备可能丢失，今后不要再次使用原客户端配置或私钥。

删除 peer 后，持有旧配置的人将无法再通过该密钥连接。

## 11. 每次新增客户端检查清单

- [ ] 在 [[家庭网络-IP地址分配]] 中选择未占用地址
- [ ] 使用 `/32`，例如 `192.168.201.4/32`
- [ ] 在华硕 WireGuard 服务端新增独立 peer
- [ ] 为设备生成独立私钥和配置
- [ ] DNS 设置为 `192.168.201.1`
- [ ] Endpoint 设置为 `openyixi.openyixi.top:51820`
- [ ] AllowedIPs 设置为 `0.0.0.0/0, ::/0`
- [ ] PersistentKeepalive 设置为 `25`
- [ ] 在外部网络测试握手
- [ ] 测试访问 `192.168.50.1`
- [ ] 测试 ShellCrash 代理出口
- [ ] 在 IP 地址分配文档中登记设备
- [ ] 安全保存或销毁导出的二维码和配置文件
