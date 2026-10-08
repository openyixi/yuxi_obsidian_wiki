# Snap Camera + OBS 高质量口播拍摄工作流（Windows）

> 目标链路：无反相机/摄像头 → Windows → Snap Camera Lens → OBS → 高质量口播视频

本文记录一次已经实际验证成功的配置过程。测试电脑使用 RTX 4090，Snap Camera 中的“大胡子 + 发型 + 墨镜”Lens 已能实时运行。

## 一、最终验证结果

实测链路如下：

- Snap Camera 虚拟摄像头输入：`1280×720 / 30fps / BGR24`
- OBS 基础画布：`1920×1080`
- OBS 输出：`1920×1080 / 30fps`
- 缩放算法：Lanczos
- 录制编码器：NVIDIA NVENC H.264
- NVENC 质量控制：CQP 18、Preset P5、High Profile
- 录制格式：MKV
- 测试文件：30.054 秒，约 91.9 MB
- 实测总平均码率：约 24.47 Mbps
- 输出视频：H.264 High、1920×1080、30fps、yuv420p、BT.709 Limited
- 音频：AAC-LC

必须注意：Snap Camera 在这台电脑上只向其他软件输出 1280×720，OBS 的 1920×1080 是将 720p 放大到 1080p，并不会增加真实细节。因此 Snap Camera 已经是分辨率瓶颈之一。

## 二、准备工作

启动顺序建议固定为：

1. 连接并打开物理摄像头。
2. 启动 Snap Camera。
3. 在 Snap Camera 中选择需要的 Lens，确认人物和特效都能实时显示。
4. 最后启动 OBS Studio。

如果 OBS 先占用了物理摄像头，Snap Camera 可能无法读取它。出现黑屏时，关闭 OBS，重新按上述顺序启动。

### 检查 OBS 是否安装

默认安装路径通常是：

```text
C:\Program Files\obs-studio\bin\64bit\obs64.exe
```

PowerShell 检查命令：

```powershell
Test-Path 'C:\Program Files\obs-studio\bin\64bit\obs64.exe'
```

返回 `True` 表示已经安装。没有安装时，可以使用：

```powershell
winget install --id OBSProject.OBSStudio --exact
```

### 安装 ffmpeg 和 ffprobe

```powershell
winget install --id Gyan.FFmpeg --exact
```

安装后重新打开 PowerShell，并检查：

```powershell
ffmpeg -version
ffprobe -version
```

## 三、确认 Snap Camera 的真实输出能力

先列出 DirectShow 设备：

```powershell
ffmpeg -hide_banner -list_devices true -f dshow -i dummy
```

应能看到：

```text
"Snap Camera" (video)
```

检查其支持的分辨率和帧率：

```powershell
ffmpeg -hide_banner -f dshow -list_options true -i video="Snap Camera"
```

本机实测输出：

```text
pixel_format=bgr24
min s=1280x720
max s=1280x720
max fps=30
```

这一步很重要：不要仅根据 OBS 的输出分辨率判断真实画质。虚拟摄像头只输出 720p 时，OBS 设置为 1080p 只是放大。

## 四、在 OBS 添加 Snap Camera

1. 打开 OBS。
2. 在“场景”区域新建或选择一个场景。
3. 在“来源”区域点击 `+`。
4. 选择“视频采集设备”。
5. 名称填写 `Snap Camera`。
6. 设备选择 `Snap Camera`。
7. 分辨率/FPS 类型选择“自定义”。
8. 分辨率设置为 `1280×720`。
9. FPS 设置为 `30`。
10. 缓冲建议先关闭，以降低口播时的画面延迟。

添加完成后：

1. 右键画面中的 Snap Camera 来源。
2. 选择“变换 → 适配屏幕”。
3. 右键来源，进入“缩放过滤”。
4. 选择 `Lanczos（36 个采样）`。

如果画面比例不正确，不要直接拖动边缘拉伸人物。先确认来源是 16:9，再使用“适配屏幕”。

## 五、OBS 视频设置

进入“设置 → 视频”：

| 设置 | 推荐值 |
|---|---|
| 基础（画布）分辨率 | 1920×1080 |
| 输出（缩放）分辨率 | 1920×1080 |
| 缩小方法 | Lanczos |
| 常用 FPS 值 | 30 |

Snap Camera 当前只有 720p 输出，因此 1080p 是为了保持剪辑、字幕和发布工作流统一，而不是为了获得更多原始细节。

色彩建议：

- 色彩格式：NV12
- 色彩空间：Rec. 709
- 色彩范围：Limited/部分

## 六、RTX 4090 的 NVENC 录制设置

进入“设置 → 输出”，将输出模式切换为“高级”，然后打开“录制”页。

推荐配置：

| 设置 | 推荐值 |
|---|---|
| 类型 | 标准 |
| 录制格式 | MKV |
| 视频编码器 | NVIDIA NVENC H.264 |
| 码率控制 | CQP |
| CQ/CQP 值 | 18；空间紧张可用 20 |
| 关键帧间隔 | 2 秒或 0（自动） |
| 预设 | P5：慢速（质量好） |
| 调优 | 高质量 |
| 多次编码模式 | 四分之一分辨率两次编码 |
| Profile | High |
| Look-ahead | 关闭 |
| 心理视觉调优 | 开启 |
| B 帧 | 2 |

选择 MKV 是因为录制中断时更不容易损坏整段文件。需要 MP4 时，在 OBS 中使用“文件 → 录像转封装”，不需要重新编码。

RTX 4090 也支持 AV1，但为了剪辑软件和发布平台兼容性，第一套稳定工作流建议先用 NVENC H.264。

## 七、录制 30 秒测试视频

录制前确认：

- Snap Camera 中 Lens 正常显示。
- OBS 预览中人物没有被裁掉。
- 音频混音器中麦克风电平会随说话变化。
- OBS 状态栏没有持续增加“丢帧”或“编码延迟”。

测试动作建议按时间完成：

1. 正脸静止 5 秒。
2. 慢速左右转头。
3. 抬头、低头。
4. 快速横向移动头部。
5. 靠近摄像头，观察胡须和脸部边缘。
6. 张嘴说话，检查胡须和嘴部遮挡关系。

录满约 30 秒后停止。

## 八、使用 ffprobe 分析文件

假设文件名为 `test.mkv`：

```powershell
ffprobe -v error `
  -show_entries "format=filename,duration,size,bit_rate,format_name:stream=index,codec_name,profile,width,height,r_frame_rate,avg_frame_rate,bit_rate,pix_fmt,color_space,color_range" `
  -of json `
  "test.mkv"
```

重点检查：

- `codec_name` 是否为 `h264`
- `profile` 是否为 `High`
- `width` 和 `height` 是否为 `1920`、`1080`
- `avg_frame_rate` 是否为 `30/1`
- `pix_fmt` 是否为 `yuv420p`
- `color_space` 是否为 `bt709`
- `duration` 是否接近测试时长
- `bit_rate` 是否明显过低

本次实测输出：

```text
时长：30.054 秒
分辨率：1920×1080
帧率：30/1 fps
视频编码：H.264 High
像素格式：yuv420p
色彩空间：BT.709
总平均码率：约 24.47 Mbps
```

MKV 中的视频流有时不单独显示 `bit_rate`，可以使用容器的总码率并结合文件大小、时长判断。

## 九、截取关键帧检查 Lens 跟踪

从 3、10、18、25 秒各截一帧：

```powershell
ffmpeg -y -ss 3  -i "test.mkv" -frames:v 1 "frame-03s.png"
ffmpeg -y -ss 10 -i "test.mkv" -frames:v 1 "frame-10s.png"
ffmpeg -y -ss 18 -i "test.mkv" -frames:v 1 "frame-18s.png"
ffmpeg -y -ss 25 -i "test.mkv" -frames:v 1 "frame-25s.png"
```

检查以下位置：

- 胡须外缘与下巴、脸颊的贴合
- 嘴部张合时胡须是否穿模或漂移
- 太阳穴、耳朵附近的眼镜腿
- 额头与假发边缘
- 快速运动后特效是否短暂滞后
- 暗部是否出现涂抹、噪点或色块

本次测试的多个抽帧中，发型、墨镜和胡须都保持贴合，没有完全丢失；但胡须细节、皮肤纹理和暗部明显偏软，符合 720p 虚拟摄像头放大到 1080p 的表现。

## 十、如何判断 Snap Camera 是否为瓶颈

满足以下情况时，可以判定 Snap Camera 是瓶颈：

1. 物理摄像头能提供 1080p 或更高分辨率。
2. Snap Camera 虚拟设备只报告 1280×720。
3. OBS 输出虽然是 1920×1080，但人物细节没有达到原生 1080p 水平。
4. 增加 NVENC 码率后，胡须、皮肤和头发细节没有明显改善。
5. 静态背景直线也能看出放大后的柔化。

本机已经符合第 2、3、4 项，因而可以确认 Snap Camera 是当前链路中的分辨率瓶颈之一。编码器不是主要瓶颈。

在确认这一点之后，优先做免费的优化：

- 增加柔和的正面补光，避免脸部处于阴影。
- 把摄像头调整到眼睛附近高度。
- 让人物占据更多画面，减少后期裁切放大。
- 避免强烈逆光和过暗环境。
- 让快门和曝光稳定，减少运动模糊。
- 保持脸部完整可见，减少手部或麦克风遮挡下巴。

在完成对比测试前，不要因为 OBS 输出看起来偏软就直接购买新相机、采集卡或手机。应先录制一段“不经过 Snap Camera 的原始摄像头画面”，以相同的 OBS 编码参数与 Snap Camera 版本做 A/B 对比。

## 十一、常见问题

### OBS 中找不到 Snap Camera

- 确认 Snap Camera 已经启动。
- 完全退出占用摄像头的软件。
- 关闭并重新打开 OBS。
- 使用 ffmpeg 的 DirectShow 设备列表确认 Windows 是否注册了虚拟摄像头。

### OBS 预览黑屏

- 按“摄像头 → Snap Camera → OBS”的顺序重新启动。
- 在 OBS 的视频采集设备属性中重新选择 Snap Camera。
- 确认没有另一个 OBS 实例或会议软件占用 Snap Camera。

### 录制文件损坏

优先录制为 MKV。不要在录制过程中强制结束 OBS。需要 MP4 时在录制完成后转封装。

### 特效跟踪容易漂移

- 改善脸部照明。
- 避免脸部太小或靠近画面边缘。
- 降低运动速度。
- 避免遮挡眉毛、眼睛、鼻子、嘴和下巴。
- 在 Snap Camera 中先确认 Lens 稳定，再启动 OBS。

### 只有画面，没有口播声音

在 OBS 中进入“设置 → 音频”，为“麦克风/辅助音频”选择实际使用的麦克风。录制前观察混音器电平，并做一次耳机回放检查。不要仅根据文件中存在 AAC 音轨就认为麦克风已经正确录入；该音轨也可能只有桌面音频。

## 十二、每次正式录制前的检查清单

- [ ] 摄像头已连接并正常曝光
- [ ] Snap Camera Lens 已加载
- [ ] OBS 来源选择的是 Snap Camera
- [ ] Snap Camera 输入为 1280×720、30fps
- [ ] OBS 画布和输出为 1920×1080、30fps
- [ ] 编码器为 NVIDIA NVENC H.264
- [ ] 录制格式为 MKV
- [ ] 麦克风电平正常且未削波
- [ ] 录制 10 秒并实际回放声音和画面
- [ ] 检查胡须边缘、眼镜、头发和快速转头跟踪
- [ ] 确认磁盘剩余空间足够

