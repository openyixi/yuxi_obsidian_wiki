const vocabulary = {
  "novice": ["新手", "pink"], "power user": ["高阶用户", "blue"],
  "prompting": ["提示；向 AI 提问", "yellow"], "impactful": ["有重大影响的", "green"],
  "cutting edge": ["前沿水平", "pink"], "take advantage of": ["充分利用", "blue"],
  "in contrast": ["相比之下", "yellow"], "commercial": ["商业的", "green"],
  "trade-offs": ["权衡与取舍", "pink"], "compile": ["整理成", "blue"],
  "timesaver": ["节省时间的方法", "yellow"], "context": ["上下文；背景", "green"],
  "fill in the blanks": ["补全缺失信息", "pink"], "generic": ["泛泛的", "blue"],
  "empathy": ["共情", "yellow"], "anthropomorphize": ["人格化", "green"],
  "capturing": ["准确呈现", "pink"], "biased": ["有偏见的", "blue"],
  "critique": ["批判性评价", "yellow"], "sycophancy": ["谄媚；迎合", "green"],
  "preconceptions": ["先入之见", "pink"], "rubric": ["评分量表", "blue"],
  "objective": ["客观的", "yellow"], "outline": ["提纲", "green"],
  "iterate": ["反复改进", "pink"], "brainstorm": ["头脑风暴", "blue"],
  "representative": ["有代表性的", "yellow"], "foundational": ["基础性的", "green"],
  "subtle": ["细微的", "pink"], "niche": ["小众的；细分的", "blue"],
  "proprietary": ["专有的；内部的", "yellow"], "rule of thumb": ["经验法则", "green"],
  "misconceptions": ["错误观念", "pink"], "outdated": ["过时的", "blue"],
  "trigger": ["触发", "yellow"], "credible": ["可信的", "green"],
  "comprehensive": ["全面的", "pink"], "synthesize": ["综合整理", "blue"],
  "insights": ["洞见", "yellow"], "agentic": ["智能体式的", "green"],
  "sophisticated": ["复杂高级的", "pink"], "execute": ["执行", "blue"],
  "revenue": ["营收", "yellow"], "hallucinate": ["产生幻觉信息", "green"]
};

const translations = {
  "0:00": "现在是 2026 年，向 AI 模型提问的方式，已经和 2022 年 ChatGPT 刚出现时大不相同。",
  "0:08": "熟练使用 AI 是你能培养的最有影响力的技能之一。还没站在 AI 应用前沿的人，经常得到令人沮丧的输出。我希望你能成为提示词专家，充分利用今天更强大的 AI 工具。让我们比较 AI 新手与高阶用户的不同体验。",
  "0:41": "相比之下，许多 AI 新手习惯像使用 Google 搜索一样，只向 AI 提简单问题。简单问题当然没问题，但遇到困难问题时，你也可以交给 AI，并给它充分的思考时间。",
  "1:10": "例如买车时，你可以把价格、参数、报价和保险方案等文件上传到 ChatGPT、Gemini 或 Claude，让它阅读全部资料、认真思考并分析不同车型之间的取舍。",
  "1:35": "这会让 AI 花几十秒甚至几分钟思考，然后为你整理出一份详细报告。",
  "1:43": "我发现这在许多任务上非常节省时间。高阶用户还懂得提供恰当的上下文或背景信息，让 AI 更容易成功回答问题；新手则常常只写一句很短的提示，然后期待 AI 自动补齐空白。",
  "2:04": "你可以把 AI 想象成一个聪明、有动力但还不了解你的应届大学毕业生。太短的提示往往不能提供足够的信息和背景，因此它无法准确回答。",
  "2:22": "如果你让 AI 帮你写一份发给老板的年度自评，却没有告诉它你过去一年做了什么，它只能写出泛泛而谈、帮助不大的内容。",
  "2:40": "相比之下，高阶用户会对 AI 有某种共情。无需把 AI 过度人格化，但你可以站在接收任务者的角度思考：对方掌握的信息，是否足够完成你交给他的任务？",
  "3:03": "高阶用户可能上传项目跟踪器截图、最近的项目文档，甚至讲述项目经历的语音备忘录，然后再要求 AI 撰写自评。",
  "3:19": "这样生成的内容就能更准确地呈现你最自豪的成果。",
  "3:24": "高阶用户还懂得如何让 AI 给出诚实反馈。AI 经常想取悦用户；如果你用带倾向性的问题提问，它往往也会给出带倾向性的答案。",
  "3:56": "如果你先说“我有一个很棒的商业创意”，再让 AI 评价它，AI 会本能地迎合你，说这个创意很棒。",
  "4:09": "这种现象有时被称为谄媚性。只要你稍微暗示自己期待的答案，AI 就很可能复述你的偏好或先入之见。",
  "4:23": "高阶用户会提出中立的问题，不向 AI 暗示自己想听到什么。你也可以提供评分量表或评价标准，迫使 AI 更客观地给出答案。"
};

let player;
let activeIndex = -1;
let activeSentenceIndex = -1;
let loopSingle = false;
let timer;
const transcriptEl = document.querySelector("#transcript");
const sentenceCache = TRANSCRIPT.map(item => splitSentences(item.text));

function splitSentences(text) {
  if (typeof Intl?.Segmenter === "function") {
    return [...new Intl.Segmenter("en", { granularity: "sentence" }).segment(text)]
      .map(item => item.segment.trim())
      .filter(Boolean);
  }
  const matches = text.match(/[^.!?]+(?:[.!?]+[\"']?|$)/g);
  return (matches || [text]).map(sentence => sentence.trim()).filter(Boolean);
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[c]);
}

function annotate(text) {
  const keys = Object.keys(vocabulary).sort((a, b) => b.length - a.length);
  const re = new RegExp(`\\b(${keys.map(k => k.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")).join("|")})\\b`, "gi");
  return escapeHtml(text).replace(re, match => {
    const item = vocabulary[match.toLowerCase()];
    return `<span class="word" data-color="${item[1]}"><span class="word-main">${match}</span><span class="word-note">${item[0]}</span></span>`;
  });
}

function renderTranscript() {
  transcriptEl.innerHTML = TRANSCRIPT.map((item, index) => `
    <article class="segment" data-index="${index}" tabindex="0">
      <button class="timestamp" data-seek="${item.start}">${item.label}</button>
      <p class="english">${sentenceCache[index].map((sentence, sentenceIndex) => `<span class="sentence" data-sentence="${sentenceIndex}">${annotate(sentence)}</span>`).join(" ")}</p>
      <p class="translation">${translations[item.label] || ""}</p>
    </article>`).join("");
  transcriptEl.addEventListener("click", event => {
    const segment = event.target.closest(".segment");
    if (!segment || !player?.seekTo) return;
    const item = TRANSCRIPT[Number(segment.dataset.index)];
    player.seekTo(item.start, true);
    player.playVideo();
  });
}

function setActive(index, sentenceIndex) {
  if (index < 0) return;
  document.querySelectorAll(".segment").forEach((el, i) => {
    el.classList.toggle("active", i === index);
    el.classList.toggle("past", i < index);
  });
  document.querySelectorAll(".sentence.active-sentence").forEach(el => el.classList.remove("active-sentence"));
  const activeSentence = document.querySelector(`.segment[data-index="${index}"] .sentence[data-sentence="${sentenceIndex}"]`);
  activeSentence?.classList.add("active-sentence");
  const changed = index !== activeIndex || sentenceIndex !== activeSentenceIndex;
  activeIndex = index;
  activeSentenceIndex = sentenceIndex;
  document.querySelector("#sectionLabel").textContent = TRANSCRIPT[index].section;
  if (changed) activeSentence?.scrollIntoView({ block: "center", behavior: "smooth" });
}

function formatTime(value) {
  const h = Math.floor(value / 3600);
  const m = Math.floor((value % 3600) / 60);
  const s = Math.floor(value % 60);
  return h ? `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}` : `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

function sync() {
  if (!player?.getCurrentTime) return;
  const now = player.getCurrentTime();
  let index = TRANSCRIPT.findLastIndex(item => item.start <= now);
  index = Math.max(0, index);
  const nextStart = TRANSCRIPT[index + 1]?.start ?? (TRANSCRIPT[index].start + Math.max(4, sentenceCache[index].length * 3));
  const duration = Math.max(.5, nextStart - TRANSCRIPT[index].start);
  const ratio = Math.min(.999, Math.max(0, (now - TRANSCRIPT[index].start) / duration));
  const sentenceIndex = Math.min(sentenceCache[index].length - 1, Math.floor(ratio * sentenceCache[index].length));
  setActive(index, sentenceIndex);
  document.querySelector("#progressLabel").textContent = `${formatTime(now)} / 02:28:01`;
  if (loopSingle && TRANSCRIPT[index + 1] && now >= TRANSCRIPT[index + 1].start - .08) player.seekTo(TRANSCRIPT[index].start, true);
}

window.onYouTubeIframeAPIReady = () => {
  player = new YT.Player("player", {
    videoId: "8ib4Qnh2HFE",
    playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
    events: {
      onReady: () => { timer = setInterval(sync, 220); },
      onStateChange: e => { document.querySelector("#playButton").textContent = e.data === YT.PlayerState.PLAYING ? "Ⅱ" : "▶"; }
    }
  });
};

document.querySelector("#playButton").addEventListener("click", () => player?.getPlayerState?.() === 1 ? player.pauseVideo() : player?.playVideo?.());
document.querySelector("#previousButton").addEventListener("click", () => player?.seekTo?.(TRANSCRIPT[Math.max(0, activeIndex - 1)].start, true));
document.querySelector("#nextButton").addEventListener("click", () => player?.seekTo?.(TRANSCRIPT[Math.min(TRANSCRIPT.length - 1, activeIndex + 1)].start, true));
document.querySelector("#loopButton").addEventListener("click", event => { loopSingle = !loopSingle; event.currentTarget.setAttribute("aria-pressed", loopSingle); });
document.querySelector("#speedSelect").addEventListener("change", event => player?.setPlaybackRate?.(Number(event.target.value)));
document.querySelector("#themeButton").addEventListener("click", () => document.body.classList.toggle("dark"));
document.querySelector("#focusButton").addEventListener("click", event => { document.body.classList.toggle("focus"); event.currentTarget.setAttribute("aria-pressed", document.body.classList.contains("focus")); });

renderTranscript();
