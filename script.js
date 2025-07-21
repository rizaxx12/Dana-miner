// script.js
let currentUser;
let miningSession;
const startBtn = document.getElementById("startBtn");
const claimBtn = document.getElementById("claimBtn");
const timerText = document.getElementById("timer");
const poinText = document.getElementById("poin");
const userName = document.getElementById("userName");

window.onload = async () => {
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    window.location.href = "login.html";
    return;
  }

  currentUser = user;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  userName.textContent = `Hi, ${profile.full_name}`;
  poinText.textContent = profile.poin;

  checkMiningSession();
};

async function checkMiningSession() {
  const { data, error } = await supabase
    .from("mining_sessions")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("start_time", { ascending: false })
    .limit(1);

  if (!data || data.length === 0 || data[0].claimed) {
    timerText.textContent = "❗ Kamu belum mulai mining";
    startBtn.style.display = "block";
    claimBtn.style.display = "none";
    return;
  }

  miningSession = data[0];
  const now = new Date();
  const endTime = new Date(miningSession.start_time);
  endTime.setHours(endTime.getHours() + 24);

  if (now >= endTime) {
    timerText.textContent = "✅ Siap di-claim!";
    startBtn.style.display = "none";
    claimBtn.style.display = "block";
  } else {
    startBtn.style.display = "none";
    claimBtn.style.display = "none";
    countdown(endTime);
  }
}

function countdown(endTime) {
  const x = setInterval(() => {
    const now = new Date().getTime();
    const distance = endTime.getTime() - now;

    if (distance <= 0) {
      clearInterval(x);
      timerText.textContent = "✅ Siap di-claim!";
      claimBtn.style.display = "block";
      return;
    }

    const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((distance / (1000 * 60)) % 60);
    const seconds = Math.floor((distance / 1000) % 60);

    timerText.textContent = `⏳ Mining... ${hours}h ${minutes}m ${seconds}s`;
  }, 1000);
}

async function startMining() {
  const now = new Date().toISOString();
  const { error } = await supabase.from("mining_sessions").insert([
    {
      user_id: currentUser.id,
      start_time: now,
      claimed: false
    }
  ]);

  if (!error) {
    alert("⛏️ Mining dimulai! Tunggu 24 jam untuk Claim.");
    location.reload();
  }
}

async function claimReward() {
  // Tambah poin ke profil
  await supabase
    .from("profiles")
    .update({ poin: supabase.literal("poin + 1000") })
    .eq("id", currentUser.id);

  // Tandai session sebagai claimed
  await supabase
    .from("mining_sessions")
    .update({ claimed: true })
    .eq("id", miningSession.id);

  alert("🎉 Kamu dapat 1000 IMR!");
  location.reload();
}

async function logout() {
  await supabase.auth.signOut();
  window.location.href = "login.html";
}
