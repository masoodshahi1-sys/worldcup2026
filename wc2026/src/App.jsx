import { useState, useEffect, useCallback } from "react";
import { db } from "./firebase";
import {
  doc, getDoc, setDoc, onSnapshot, collection, getDocs
} from "firebase/firestore";

// ─── TRANSLATIONS ─────────────────────────────────────────────────────────────
const T = {
  fa: {
    dir: "rtl", appTitle: "جام‌جهانی ۲۰۲۶", appSubtitle: "پیش‌بینی مسابقات",
    login: "ورود", register: "ثبت‌نام", logout: "خروج",
    username: "نام کاربری", password: "رمز عبور", confirmPassword: "تکرار رمز",
    matches: "بازی‌ها", leaderboard: "جدول", myPredictions: "پیش‌بینی‌های من",
    adminPanel: "پنل ادمین", predict: "پیش‌بینی", save: "ذخیره", cancel: "انصراف",
    home: "میزبان", away: "مهمان", points: "امتیاز",
    totalPoints: "کل امتیاز", predicted: "پیش‌بینی شده", notPredicted: "پیش‌بینی نشده",
    upcoming: "پیش‌رو", finished: "پایان",
    group: "مرحله گروهی", round32: "یک‌شانزدهم", round16: "یک‌هشتم",
    quarter: "یک‌چهارم", semi: "نیمه‌نهایی", third: "رده‌بندی سوم", final: "فینال",
    setResult: "ثبت نتیجه", addMatch: "افزودن بازی",
    stage: "مرحله", userManagement: "مدیریت کاربران",
    deleteUser: "حذف", usernameExists: "این نام کاربری قبلاً ثبت شده",
    wrongCredentials: "نام کاربری یا رمز اشتباه است", passwordMismatch: "رمزها یکسان نیستند",
    fillAll: "لطفاً همه فیلدها را پر کنید",
    exactScore: "نتیجه دقیق", correctDiff: "اختلاف گل صحیح", correctWinner: "برنده صحیح",
    wrongResult: "نتیجه اشتباه", noPrediction: "عدم پیش‌بینی", pts: "امتیاز",
    switchLang: "EN", noMatches: "هنوز بازی‌ای ثبت نشده",
    matchAdded: "بازی اضافه شد", resultSaved: "نتیجه ثبت شد", predictionSaved: "پیش‌بینی ذخیره شد",
    predictionLocked: "⏰ مهلت پیش‌بینی این بازی تمام شده", confirmDelete: "آیا مطمئنید؟",
    myRank: "رتبه من", totalPlayers: "تعداد بازیکنان", prediction: "پیش‌بینی", actual: "نتیجه",
    lockedBadge: "قفل شده", groupLabel: "گروه", allGroups: "همه گروه‌ها",
    editPrediction: "ویرایش", connecting: "در حال اتصال...", groupStandings: "جدول گروه‌ها",
    played: "بازی", won: "برد", drawn: "مساوی", lost: "باخت", gf: "گل زده",
    ga: "گل خورده", gd: "تفاضل", standing: "رتبه", team: "تیم",
    pendingResults: "بازی منتظر ثبت نتیجه",
  },
  en: {
    dir: "ltr", appTitle: "World Cup 2026", appSubtitle: "Match Predictions",
    login: "Login", register: "Register", logout: "Logout",
    username: "Username", password: "Password", confirmPassword: "Confirm Password",
    matches: "Matches", leaderboard: "Leaderboard", myPredictions: "My Predictions",
    adminPanel: "Admin Panel", predict: "Predict", save: "Save", cancel: "Cancel",
    home: "Home", away: "Away", points: "Points",
    totalPoints: "Total Points", predicted: "Predicted", notPredicted: "Not Predicted",
    upcoming: "Upcoming", finished: "Finished",
    group: "Group Stage", round32: "Round of 32", round16: "Round of 16",
    quarter: "Quarterfinal", semi: "Semifinal", third: "3rd Place", final: "Final",
    setResult: "Set Result", addMatch: "Add Match",
    stage: "Stage", userManagement: "Users",
    deleteUser: "Delete", usernameExists: "Username already taken",
    wrongCredentials: "Wrong username or password", passwordMismatch: "Passwords don't match",
    fillAll: "Please fill all fields",
    exactScore: "Exact Score", correctDiff: "Correct Goal Diff", correctWinner: "Correct Winner",
    wrongResult: "Wrong Result", noPrediction: "No Prediction", pts: "pts",
    switchLang: "فا", noMatches: "No matches added yet",
    matchAdded: "Match added", resultSaved: "Result saved", predictionSaved: "Prediction saved",
    predictionLocked: "⏰ Prediction deadline has passed", confirmDelete: "Are you sure?",
    myRank: "My Rank", totalPlayers: "Players", prediction: "Prediction", actual: "Result",
    lockedBadge: "Locked", groupLabel: "Group", allGroups: "All Groups",
    editPrediction: "Edit", connecting: "Connecting...", groupStandings: "Group Standings",
    played: "P", won: "W", drawn: "D", lost: "L", gf: "GF", ga: "GA", gd: "GD", standing: "#", team: "Team",
    pendingResults: "matches awaiting result",
  },
};

// ─── SCORING ──────────────────────────────────────────────────────────────────
function calcPoints(pred, actual) {
  if (!pred || pred.home === "" || pred.away === "" || pred.home === undefined) return 0;
  if (!actual || actual.home === "" || actual.away === "") return 0;
  const ph = parseInt(pred.home), pa = parseInt(pred.away);
  const ah = parseInt(actual.home), aa = parseInt(actual.away);
  if (isNaN(ph)||isNaN(pa)||isNaN(ah)||isNaN(aa)) return 0;
  if (ph===ah && pa===aa) return 10;
  if (ph-pa===ah-aa) return 7;
  const pw = ph>pa?"H":ph<pa?"A":"D";
  const aw = ah>aa?"H":ah<aa?"A":"D";
  if (pw===aw) return 5;
  return 2;
}
function ptsCls(p){ return p===10?"pts-10":p===7?"pts-7":p===5?"pts-5":p===2?"pts-2":"pts-0"; }

// ─── GROUP STANDINGS CALCULATOR ───────────────────────────────────────────────
function calcGroupStandings(matches) {
  const groups = {};
  matches.filter(m=>m.stage==="group").forEach(m => {
    if (!groups[m.group]) groups[m.group] = {};
    [m.home, m.away].forEach(team => {
      if (!groups[m.group][team]) groups[m.group][team] = { team, flag: team===m.home?m.homeFlag:m.awayFlag, p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0 };
    });
    if (m.result.home===""||m.result.away==="") return;
    const ah=parseInt(m.result.home), aa=parseInt(m.result.away);
    const ht=groups[m.group][m.home], at=groups[m.group][m.away];
    ht.p++; at.p++; ht.gf+=ah; ht.ga+=aa; at.gf+=aa; at.ga+=ah;
    if (ah>aa){ht.w++;ht.pts+=3;at.l++;}
    else if (ah<aa){at.w++;at.pts+=3;ht.l++;}
    else{ht.d++;at.d++;ht.pts++;at.pts++;}
  });
  // Sort each group: pts → gd → gf
  const sorted = {};
  Object.entries(groups).forEach(([g, teams]) => {
    sorted[g] = Object.values(teams).sort((a,b)=>{
      if (b.pts!==a.pts) return b.pts-a.pts;
      const agd=(b.gf-b.ga)-(a.gf-a.ga); if (agd!==0) return agd;
      return b.gf-a.gf;
    });
  });
  return sorted;
}

// ─── ALL 48 GROUP MATCHES ─────────────────────────────────────────────────────
const ALL_MATCHES = [
  {id:"g-a1",home:"Mexico",homeFlag:"🇲🇽",away:"Poland",awayFlag:"🇵🇱",date:"2026-06-11T23:00Z",stage:"group",group:"A",result:{home:"",away:""}},
  {id:"g-a2",home:"Saudi Arabia",homeFlag:"🇸🇦",away:"Argentina",awayFlag:"🇦🇷",date:"2026-06-12T02:00Z",stage:"group",group:"A",result:{home:"",away:""}},
  {id:"g-a3",home:"Poland",homeFlag:"🇵🇱",away:"Saudi Arabia",awayFlag:"🇸🇦",date:"2026-06-16T22:00Z",stage:"group",group:"A",result:{home:"",away:""}},
  {id:"g-a4",home:"Argentina",homeFlag:"🇦🇷",away:"Mexico",awayFlag:"🇲🇽",date:"2026-06-17T01:00Z",stage:"group",group:"A",result:{home:"",away:""}},
  {id:"g-a5",home:"Poland",homeFlag:"🇵🇱",away:"Argentina",awayFlag:"🇦🇷",date:"2026-06-21T22:00Z",stage:"group",group:"A",result:{home:"",away:""}},
  {id:"g-a6",home:"Saudi Arabia",homeFlag:"🇸🇦",away:"Mexico",awayFlag:"🇲🇽",date:"2026-06-21T22:00Z",stage:"group",group:"A",result:{home:"",away:""}},
  {id:"g-b1",home:"USA",homeFlag:"🇺🇸",away:"Jamaica",awayFlag:"🇯🇲",date:"2026-06-12T23:00Z",stage:"group",group:"B",result:{home:"",away:""}},
  {id:"g-b2",home:"Panama",homeFlag:"🇵🇦",away:"Canada",awayFlag:"🇨🇦",date:"2026-06-13T02:00Z",stage:"group",group:"B",result:{home:"",away:""}},
  {id:"g-b3",home:"Jamaica",homeFlag:"🇯🇲",away:"Panama",awayFlag:"🇵🇦",date:"2026-06-17T22:00Z",stage:"group",group:"B",result:{home:"",away:""}},
  {id:"g-b4",home:"Canada",homeFlag:"🇨🇦",away:"USA",awayFlag:"🇺🇸",date:"2026-06-18T01:00Z",stage:"group",group:"B",result:{home:"",away:""}},
  {id:"g-b5",home:"Jamaica",homeFlag:"🇯🇲",away:"Canada",awayFlag:"🇨🇦",date:"2026-06-22T22:00Z",stage:"group",group:"B",result:{home:"",away:""}},
  {id:"g-b6",home:"Panama",homeFlag:"🇵🇦",away:"USA",awayFlag:"🇺🇸",date:"2026-06-22T22:00Z",stage:"group",group:"B",result:{home:"",away:""}},
  {id:"g-c1",home:"Morocco",homeFlag:"🇲🇦",away:"Ecuador",awayFlag:"🇪🇨",date:"2026-06-13T19:00Z",stage:"group",group:"C",result:{home:"",away:""}},
  {id:"g-c2",home:"Belgium",homeFlag:"🇧🇪",away:"Ukraine",awayFlag:"🇺🇦",date:"2026-06-13T22:00Z",stage:"group",group:"C",result:{home:"",away:""}},
  {id:"g-c3",home:"Ecuador",homeFlag:"🇪🇨",away:"Belgium",awayFlag:"🇧🇪",date:"2026-06-17T19:00Z",stage:"group",group:"C",result:{home:"",away:""}},
  {id:"g-c4",home:"Ukraine",homeFlag:"🇺🇦",away:"Morocco",awayFlag:"🇲🇦",date:"2026-06-18T22:00Z",stage:"group",group:"C",result:{home:"",away:""}},
  {id:"g-c5",home:"Ecuador",homeFlag:"🇪🇨",away:"Ukraine",awayFlag:"🇺🇦",date:"2026-06-22T19:00Z",stage:"group",group:"C",result:{home:"",away:""}},
  {id:"g-c6",home:"Belgium",homeFlag:"🇧🇪",away:"Morocco",awayFlag:"🇲🇦",date:"2026-06-22T19:00Z",stage:"group",group:"C",result:{home:"",away:""}},
  {id:"g-d1",home:"Iran",homeFlag:"🇮🇷",away:"New Zealand",awayFlag:"🇳🇿",date:"2026-06-14T19:00Z",stage:"group",group:"D",result:{home:"",away:""}},
  {id:"g-d2",home:"Portugal",homeFlag:"🇵🇹",away:"Senegal",awayFlag:"🇸🇳",date:"2026-06-14T22:00Z",stage:"group",group:"D",result:{home:"",away:""}},
  {id:"g-d3",home:"New Zealand",homeFlag:"🇳🇿",away:"Portugal",awayFlag:"🇵🇹",date:"2026-06-18T19:00Z",stage:"group",group:"D",result:{home:"",away:""}},
  {id:"g-d4",home:"Senegal",homeFlag:"🇸🇳",away:"Iran",awayFlag:"🇮🇷",date:"2026-06-19T22:00Z",stage:"group",group:"D",result:{home:"",away:""}},
  {id:"g-d5",home:"New Zealand",homeFlag:"🇳🇿",away:"Senegal",awayFlag:"🇸🇳",date:"2026-06-23T19:00Z",stage:"group",group:"D",result:{home:"",away:""}},
  {id:"g-d6",home:"Portugal",homeFlag:"🇵🇹",away:"Iran",awayFlag:"🇮🇷",date:"2026-06-23T19:00Z",stage:"group",group:"D",result:{home:"",away:""}},
  {id:"g-e1",home:"Germany",homeFlag:"🇩🇪",away:"Japan",awayFlag:"🇯🇵",date:"2026-06-14T22:00Z",stage:"group",group:"E",result:{home:"",away:""}},
  {id:"g-e2",home:"Australia",homeFlag:"🇦🇺",away:"Spain",awayFlag:"🇪🇸",date:"2026-06-15T01:00Z",stage:"group",group:"E",result:{home:"",away:""}},
  {id:"g-e3",home:"Japan",homeFlag:"🇯🇵",away:"Australia",awayFlag:"🇦🇺",date:"2026-06-18T22:00Z",stage:"group",group:"E",result:{home:"",away:""}},
  {id:"g-e4",home:"Spain",homeFlag:"🇪🇸",away:"Germany",awayFlag:"🇩🇪",date:"2026-06-19T01:00Z",stage:"group",group:"E",result:{home:"",away:""}},
  {id:"g-e5",home:"Japan",homeFlag:"🇯🇵",away:"Spain",awayFlag:"🇪🇸",date:"2026-06-23T22:00Z",stage:"group",group:"E",result:{home:"",away:""}},
  {id:"g-e6",home:"Australia",homeFlag:"🇦🇺",away:"Germany",awayFlag:"🇩🇪",date:"2026-06-23T22:00Z",stage:"group",group:"E",result:{home:"",away:""}},
  {id:"g-f1",home:"Brazil",homeFlag:"🇧🇷",away:"Croatia",awayFlag:"🇭🇷",date:"2026-06-15T19:00Z",stage:"group",group:"F",result:{home:"",away:""}},
  {id:"g-f2",home:"Netherlands",homeFlag:"🇳🇱",away:"South Korea",awayFlag:"🇰🇷",date:"2026-06-15T22:00Z",stage:"group",group:"F",result:{home:"",away:""}},
  {id:"g-f3",home:"Croatia",homeFlag:"🇭🇷",away:"Netherlands",awayFlag:"🇳🇱",date:"2026-06-19T19:00Z",stage:"group",group:"F",result:{home:"",away:""}},
  {id:"g-f4",home:"South Korea",homeFlag:"🇰🇷",away:"Brazil",awayFlag:"🇧🇷",date:"2026-06-20T22:00Z",stage:"group",group:"F",result:{home:"",away:""}},
  {id:"g-f5",home:"Croatia",homeFlag:"🇭🇷",away:"South Korea",awayFlag:"🇰🇷",date:"2026-06-24T19:00Z",stage:"group",group:"F",result:{home:"",away:""}},
  {id:"g-f6",home:"Netherlands",homeFlag:"🇳🇱",away:"Brazil",awayFlag:"🇧🇷",date:"2026-06-24T19:00Z",stage:"group",group:"F",result:{home:"",away:""}},
  {id:"g-g1",home:"France",homeFlag:"🇫🇷",away:"Nigeria",awayFlag:"🇳🇬",date:"2026-06-15T22:00Z",stage:"group",group:"G",result:{home:"",away:""}},
  {id:"g-g2",home:"Algeria",homeFlag:"🇩🇿",away:"England",awayFlag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",date:"2026-06-16T01:00Z",stage:"group",group:"G",result:{home:"",away:""}},
  {id:"g-g3",home:"Nigeria",homeFlag:"🇳🇬",away:"Algeria",awayFlag:"🇩🇿",date:"2026-06-20T19:00Z",stage:"group",group:"G",result:{home:"",away:""}},
  {id:"g-g4",home:"England",homeFlag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",away:"France",awayFlag:"🇫🇷",date:"2026-06-20T22:00Z",stage:"group",group:"G",result:{home:"",away:""}},
  {id:"g-g5",home:"Nigeria",homeFlag:"🇳🇬",away:"England",awayFlag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",date:"2026-06-24T22:00Z",stage:"group",group:"G",result:{home:"",away:""}},
  {id:"g-g6",home:"Algeria",homeFlag:"🇩🇿",away:"France",awayFlag:"🇫🇷",date:"2026-06-24T22:00Z",stage:"group",group:"G",result:{home:"",away:""}},
  {id:"g-h1",home:"Colombia",homeFlag:"🇨🇴",away:"Ivory Coast",awayFlag:"🇨🇮",date:"2026-06-16T19:00Z",stage:"group",group:"H",result:{home:"",away:""}},
  {id:"g-h2",home:"Turkey",homeFlag:"🇹🇷",away:"Uruguay",awayFlag:"🇺🇾",date:"2026-06-16T22:00Z",stage:"group",group:"H",result:{home:"",away:""}},
  {id:"g-h3",home:"Ivory Coast",homeFlag:"🇨🇮",away:"Turkey",awayFlag:"🇹🇷",date:"2026-06-20T19:00Z",stage:"group",group:"H",result:{home:"",away:""}},
  {id:"g-h4",home:"Uruguay",homeFlag:"🇺🇾",away:"Colombia",awayFlag:"🇨🇴",date:"2026-06-20T22:00Z",stage:"group",group:"H",result:{home:"",away:""}},
  {id:"g-h5",home:"Ivory Coast",homeFlag:"🇨🇮",away:"Uruguay",awayFlag:"🇺🇾",date:"2026-06-24T19:00Z",stage:"group",group:"H",result:{home:"",away:""}},
  {id:"g-h6",home:"Turkey",homeFlag:"🇹🇷",away:"Colombia",awayFlag:"🇨🇴",date:"2026-06-24T19:00Z",stage:"group",group:"H",result:{home:"",away:""}},
];

const STAGE_ORDER = ["group","round32","round16","quarter","semi","third","final"];
const sortByDate = arr => [...arr].sort((a,b)=>new Date(a.date)-new Date(b.date));
const stageLabel = (s,t) => ({group:t.group,round32:t.round32,round16:t.round16,quarter:t.quarter,semi:t.semi,third:t.third,final:t.final}[s]||s);

// ─── FIREBASE HELPERS ─────────────────────────────────────────────────────────
async function fbGet(docPath) {
  const [col, id] = docPath.split("/");
  const snap = await getDoc(doc(db, col, id));
  return snap.exists() ? snap.data().value : null;
}
async function fbSet(docPath, value) {
  const [col, id] = docPath.split("/");
  await setDoc(doc(db, col, id), { value });
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [lang, setLang]   = useState("fa");
  const t = T[lang];
  const [users, setUsers] = useState({});
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [tab, setTab]     = useState("matches");
  const [authMode, setAuthMode] = useState("login");
  const [form, setForm]   = useState({username:"",password:"",confirm:""});
  const [authError, setAuthError] = useState("");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const ADMIN_PASS = "admin2026";

  // ── Real-time listeners ──
  useEffect(() => {
    // Load initial data then set up listeners
    const unsubMatches = onSnapshot(doc(db,"data","matches"), snap => {
      if (snap.exists()) setMatches(sortByDate(snap.data().value));
      else { setMatches(sortByDate(ALL_MATCHES)); fbSet("data/matches", ALL_MATCHES); }
    });
    const unsubUsers = onSnapshot(doc(db,"data","users"), snap => {
      setUsers(snap.exists() ? snap.data().value : {});
    });
    const unsubPreds = onSnapshot(doc(db,"data","predictions"), snap => {
      setPredictions(snap.exists() ? snap.data().value : {});
    });

    const sess = sessionStorage.getItem("wc26_user");
    if (sess) setCurrentUser(sess);
    setLoading(false);

    return () => { unsubMatches(); unsubUsers(); unsubPreds(); };
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""), 2800); };
  const saveUsers   = async u => { setUsers(u);   await fbSet("data/users", u); };
  const saveMatches = async m => { const s=sortByDate(m); setMatches(s); await fbSet("data/matches", s); };
  const savePreds   = async p => { setPredictions(p); await fbSet("data/predictions", p); };

  const handleAuth = async () => {
    const {username,password,confirm} = form;
    if (!username.trim()||!password) return setAuthError(t.fillAll);
    if (username==="admin") {
      if (password!==ADMIN_PASS) return setAuthError(t.wrongCredentials);
      setCurrentUser("admin"); sessionStorage.setItem("wc26_user","admin");
      setAuthError(""); return;
    }
    if (authMode==="register") {
      if (password!==confirm) return setAuthError(t.passwordMismatch);
      if (users[username])    return setAuthError(t.usernameExists);
      const nu={...users,[username]:{password,createdAt:Date.now()}};
      await saveUsers(nu);
      setCurrentUser(username); sessionStorage.setItem("wc26_user",username);
      setAuthError(""); setForm({username:"",password:"",confirm:""});
    } else {
      if (!users[username]||users[username].password!==password) return setAuthError(t.wrongCredentials);
      setCurrentUser(username); sessionStorage.setItem("wc26_user",username);
      setAuthError(""); setForm({username:"",password:"",confirm:""});
    }
  };

  const logout = () => { setCurrentUser(null); sessionStorage.removeItem("wc26_user"); setTab("matches"); };
  const isAdmin = currentUser==="admin";

  const getLeaderboard = () => {
    const scores = {};
    Object.keys(users).forEach(u=>{ scores[u]=0; });
    matches.forEach(m=>{
      if (m.result.home===""||m.result.away==="") return;
      Object.keys(predictions).forEach(u=>{ scores[u]=(scores[u]||0)+calcPoints(predictions[u]?.[m.id],m.result); });
    });
    return Object.entries(scores).sort((a,b)=>b[1]-a[1]).map(([user,pts],i)=>({user,pts,rank:i+1}));
  };

  const groupStandings = calcGroupStandings(matches);

  if (loading) return <Loader />;

  return (
    <div dir={t.dir} style={{minHeight:"100vh",background:"linear-gradient(135deg,#050d1a 0%,#0a1628 60%,#06101e 100%)",color:"#e8eaf0",fontFamily:lang==="fa"?"'Vazirmatn','Tahoma',sans-serif":"'Exo 2','Segoe UI',sans-serif",position:"relative"}}>
      <style>{CSS}</style>

      <header style={{background:"rgba(0,0,0,.5)",backdropFilter:"blur(14px)",borderBottom:"1px solid rgba(240,192,64,.18)",padding:"0 16px",position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:940,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:58}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:26}}>⚽</span>
            <div>
              <div style={{fontWeight:900,fontSize:15,color:"#f0c040",letterSpacing:1}}>{t.appTitle}</div>
              <div style={{fontSize:9,color:"#8899bb",letterSpacing:2}}>{t.appSubtitle.toUpperCase()}</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button className="btn btn-ghost sm" onClick={()=>setLang(lang==="fa"?"en":"fa")}>{t.switchLang}</button>
            {currentUser&&<><span style={{fontSize:12,color:"#aab"}}>👤 {currentUser}</span><button className="btn btn-ghost sm" onClick={logout}>{t.logout}</button></>}
          </div>
        </div>
      </header>

      <div style={{maxWidth:940,margin:"0 auto",padding:"0 12px 80px"}}>
        {!currentUser
          ? <AuthPanel t={t} form={form} setForm={setForm} authMode={authMode} setAuthMode={setAuthMode} authError={authError} onSubmit={handleAuth}/>
          : <>
              <div style={{display:"flex",borderBottom:"1px solid rgba(255,255,255,.08)",marginBottom:16,overflowX:"auto",paddingTop:8}}>
                {["matches","standings","leaderboard","myPredictions",...(isAdmin?["adminPanel"]:[])].map(k=>(
                  <button key={k} className={`tab-btn${tab===k?" active":""}`} onClick={()=>setTab(k)}>
                    {k==="matches"?"⚽ "+t.matches:k==="standings"?"📊 "+t.groupStandings:k==="leaderboard"?"🏆 "+t.leaderboard:k==="myPredictions"?"📋 "+t.myPredictions:"⚙️ "+t.adminPanel}
                  </button>
                ))}
              </div>
              <div className="animate-in">
                {tab==="matches"       && <MatchesTab       t={t} lang={lang} matches={matches} predictions={predictions} currentUser={currentUser} savePreds={savePreds} showToast={showToast}/>}
                {tab==="standings"     && <StandingsTab     t={t} lang={lang} standings={groupStandings} matches={matches}/>}
                {tab==="leaderboard"   && <LeaderboardTab   t={t} leaderboard={getLeaderboard()} currentUser={currentUser}/>}
                {tab==="myPredictions" && <MyPredsTab       t={t} matches={matches} predictions={predictions} currentUser={currentUser}/>}
                {tab==="adminPanel"&&isAdmin&&<AdminTab     t={t} lang={lang} matches={matches} saveMatches={saveMatches} users={users} saveUsers={saveUsers} predictions={predictions} savePreds={savePreds} showToast={showToast}/>}
              </div>
            </>
        }
      </div>

      {toast&&<div className="toast">✓ {toast}</div>}

      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(5,13,26,.97)",borderTop:"1px solid rgba(240,192,64,.12)",padding:"5px 12px",display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap",fontSize:11}}>
        <span className="pts-pill pts-10">10 {t.pts}: {t.exactScore}</span>
        <span className="pts-pill pts-7">7 {t.pts}: {t.correctDiff}</span>
        <span className="pts-pill pts-5">5 {t.pts}: {t.correctWinner}</span>
        <span className="pts-pill pts-2">2 {t.pts}: {t.wrongResult}</span>
        <span className="pts-pill pts-0">0 {t.pts}: {t.noPrediction}</span>
      </div>
    </div>
  );
}

// ─── AUTH PANEL ───────────────────────────────────────────────────────────────
function AuthPanel({t,form,setForm,authMode,setAuthMode,authError,onSubmit}){
  return(
    <div style={{display:"flex",justifyContent:"center",alignItems:"center",minHeight:"82vh"}}>
      <div style={{width:"100%",maxWidth:380}}>
        <div style={{textAlign:"center",marginBottom:30}}>
          <div style={{fontSize:60,filter:"drop-shadow(0 0 24px rgba(240,192,64,.5))",marginBottom:10}}>🏆</div>
          <div style={{fontSize:20,fontWeight:900,color:"#f0c040",letterSpacing:2}}>FIFA WORLD CUP</div>
          <div style={{fontSize:32,fontWeight:900,color:"#fff",letterSpacing:4}}>2026</div>
          <div style={{fontSize:11,color:"#8899bb",marginTop:4,letterSpacing:2}}>{t.appSubtitle.toUpperCase()}</div>
        </div>
        <div className="card" style={{padding:"26px 22px"}}>
          <div style={{display:"flex",gap:4,marginBottom:20,background:"rgba(255,255,255,.05)",borderRadius:8,padding:4}}>
            {["login","register"].map(m=>(
              <button key={m} onClick={()=>setAuthMode(m)} style={{flex:1,padding:8,border:"none",borderRadius:6,cursor:"pointer",fontWeight:600,fontSize:13,background:authMode===m?"linear-gradient(135deg,#f0c040,#e08020)":"transparent",color:authMode===m?"#0a0f1e":"#aab",transition:"all .2s",fontFamily:"inherit"}}>
                {m==="login"?t.login:t.register}
              </button>
            ))}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:11}}>
            <input className="inp" placeholder={t.username} value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))}/>
            <input className="inp" type="password" placeholder={t.password} value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&onSubmit()}/>
            {authMode==="register"&&<input className="inp" type="password" placeholder={t.confirmPassword} value={form.confirm} onChange={e=>setForm(f=>({...f,confirm:e.target.value}))}/>}
            {authError&&<div style={{color:"#ff6b6b",fontSize:12,padding:"5px 10px",background:"rgba(220,50,50,.1)",borderRadius:6}}>{authError}</div>}
            <button className="btn btn-primary" onClick={onSubmit} style={{marginTop:4,fontFamily:"inherit"}}>{authMode==="login"?t.login:t.register}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MATCHES TAB ──────────────────────────────────────────────────────────────
function MatchesTab({t,lang,matches,predictions,currentUser,savePreds,showToast}){
  const [predModal,setPredModal]=useState(null);
  const [predVal,setPredVal]=useState({home:"",away:""});
  const [filterGroup,setFilterGroup]=useState("all");

  const isLocked  = m => new Date(m.date)<=new Date();
  const hasResult = m => m.result.home!==""&&m.result.away!=="";

  const openPred = m => {
    if(isLocked(m)) return showToast(t.predictionLocked);
    setPredVal(predictions[currentUser]?.[m.id]||{home:"",away:""});
    setPredModal(m);
  };
  const savePred = async()=>{
    if(predVal.home===""||predVal.away==="") return;
    await savePreds({...predictions,[currentUser]:{...(predictions[currentUser]||{}),[predModal.id]:{home:predVal.home,away:predVal.away}}});
    setPredModal(null); showToast(t.predictionSaved);
  };

  const groups=[...new Set(matches.filter(m=>m.stage==="group").map(m=>m.group))].sort();
  const displayed=matches.filter(m=>filterGroup==="all"||m.group===filterGroup||m.stage!=="group");
  const byStage={};
  displayed.forEach(m=>{(byStage[m.stage]=byStage[m.stage]||[]).push(m);});

  return(
    <div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
        <button className={`filter-btn${filterGroup==="all"?" active":""}`} onClick={()=>setFilterGroup("all")}>{t.allGroups}</button>
        {groups.map(g=><button key={g} className={`filter-btn${filterGroup===g?" active":""}`} onClick={()=>setFilterGroup(g)}>{t.groupLabel} {g}</button>)}
      </div>

      {matches.length===0&&<div className="card" style={{textAlign:"center",color:"#8899bb",padding:40}}>{t.noMatches}</div>}

      {STAGE_ORDER.map(stage=>{
        const sm=byStage[stage]; if(!sm?.length) return null;
        return(
          <div key={stage}>
            <StageDivider label={stageLabel(stage,t)}/>
            {sm.map(m=>{
              const myP=predictions[currentUser]?.[m.id];
              const pts=hasResult(m)?calcPoints(myP,m.result):null;
              const locked=isLocked(m); const res=hasResult(m);
              return(
                <div key={m.id} className="card" style={{borderColor:res?"rgba(80,224,128,.15)":locked?"rgba(255,255,255,.06)":"rgba(240,192,64,.15)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:6}}>
                    <div style={{display:"flex",gap:6,alignItems:"center"}}>
                      {res&&<span className="badge badge-green">✓ {t.finished}</span>}
                      {!res&&locked&&<span className="badge badge-red">🔒 {t.lockedBadge}</span>}
                      {!res&&!locked&&<span className="badge badge-blue">⏰ {t.upcoming}</span>}
                      {m.group&&<span className="badge badge-gold">{t.groupLabel} {m.group}</span>}
                    </div>
                    <span style={{fontSize:11,color:"#556"}}>
                      {new Date(m.date).toLocaleString(lang==="fa"?"fa-IR":"en-GB",{timeZone:"Asia/Tehran",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}
                    </span>
                  </div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                    <TeamCell flag={m.homeFlag} name={m.home}/>
                    <div style={{textAlign:"center",minWidth:90}}>
                      {res?<div style={{fontSize:28,fontWeight:900,color:"#f0c040",letterSpacing:3}}>{m.result.home} – {m.result.away}</div>:<div style={{fontSize:16,color:"#334",fontWeight:700}}>VS</div>}
                      {pts!==null&&<div style={{marginTop:5}}><span className={`pts-pill ${ptsCls(pts)}`}>{pts} {t.pts}</span></div>}
                    </div>
                    <TeamCell flag={m.awayFlag} name={m.away}/>
                  </div>
                  <div style={{marginTop:12,paddingTop:10,borderTop:"1px solid rgba(255,255,255,.05)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{fontSize:12,color:"#8899bb"}}>
                      {myP?.home!==undefined?<span>📌 {t.prediction}: <strong style={{color:"#f0c040"}}>{myP.home} – {myP.away}</strong></span>:<span style={{color:"#445"}}>— {t.notPredicted}</span>}
                    </div>
                    {!locked&&<button className="btn btn-primary" style={{padding:"6px 14px",fontSize:12,fontFamily:"inherit"}} onClick={()=>openPred(m)}>{myP?"✏️ "+t.editPrediction:"⚽ "+t.predict}</button>}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {predModal&&(
        <Modal onClose={()=>setPredModal(null)}>
          <div style={{textAlign:"center",marginBottom:16}}>
            <div style={{fontSize:11,color:"#8899bb",marginBottom:6}}>⚽ {t.predict}</div>
            <div style={{fontWeight:700,fontSize:15}}>{predModal.homeFlag} {predModal.home} <span style={{color:"#334"}}>vs</span> {predModal.awayFlag} {predModal.away}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:18,margin:"18px 0"}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:11,color:"#8899bb",marginBottom:6}}>{predModal.home}</div>
              <input type="number" min="0" max="20" className="score-input" value={predVal.home} onChange={e=>setPredVal(v=>({...v,home:e.target.value}))}/>
            </div>
            <div style={{fontSize:24,color:"#f0c040",fontWeight:900}}>–</div>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:11,color:"#8899bb",marginBottom:6}}>{predModal.away}</div>
              <input type="number" min="0" max="20" className="score-input" value={predVal.away} onChange={e=>setPredVal(v=>({...v,away:e.target.value}))}/>
            </div>
          </div>
          <div style={{display:"flex",gap:8,marginTop:14}}>
            <button className="btn btn-ghost" style={{flex:1,fontFamily:"inherit"}} onClick={()=>setPredModal(null)}>{t.cancel}</button>
            <button className="btn btn-primary" style={{flex:1,fontFamily:"inherit"}} onClick={savePred}>{t.save}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── GROUP STANDINGS TAB ──────────────────────────────────────────────────────
function StandingsTab({t,lang,standings,matches}){
  const groups=Object.keys(standings).sort();
  const [sel,setSel]=useState(groups[0]||"A");

  if(groups.length===0) return <div className="card" style={{textAlign:"center",color:"#8899bb",padding:40}}>📊</div>;

  const groupMatches=matches.filter(m=>m.stage==="group"&&m.group===sel);

  return(
    <div>
      {/* Group selector */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
        {groups.map(g=><button key={g} className={`filter-btn${sel===g?" active":""}`} onClick={()=>setSel(g)}>{t.groupLabel} {g}</button>)}
      </div>

      {/* Standing table */}
      <div className="card" style={{padding:0,overflow:"hidden",marginBottom:16}}>
        <div style={{padding:"10px 14px",background:"rgba(240,192,64,.07)",borderBottom:"1px solid rgba(255,255,255,.06)",fontWeight:700,fontSize:12,color:"#f0c040",letterSpacing:1}}>
          {t.groupLabel} {sel}
        </div>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead>
            <tr style={{background:"rgba(255,255,255,.03)",color:"#8899bb",fontSize:11}}>
              <th style={{padding:"8px 12px",textAlign:"start",fontWeight:600}}>#</th>
              <th style={{padding:"8px 4px",textAlign:"start",fontWeight:600}}>{t.team}</th>
              <th style={{padding:"8px 6px",textAlign:"center",fontWeight:600}}>{t.played}</th>
              <th style={{padding:"8px 6px",textAlign:"center",fontWeight:600}}>{t.won}</th>
              <th style={{padding:"8px 6px",textAlign:"center",fontWeight:600}}>{t.drawn}</th>
              <th style={{padding:"8px 6px",textAlign:"center",fontWeight:600}}>{t.lost}</th>
              <th style={{padding:"8px 6px",textAlign:"center",fontWeight:600}}>{t.gf}</th>
              <th style={{padding:"8px 6px",textAlign:"center",fontWeight:600}}>{t.ga}</th>
              <th style={{padding:"8px 6px",textAlign:"center",fontWeight:600}}>{t.gd}</th>
              <th style={{padding:"8px 12px",textAlign:"center",fontWeight:700,color:"#f0c040"}}>{t.pts}</th>
            </tr>
          </thead>
          <tbody>
            {(standings[sel]||[]).map((row,i)=>(
              <tr key={row.team} style={{borderTop:"1px solid rgba(255,255,255,.04)",background:i<2?"rgba(80,224,128,.04)":"transparent"}}>
                <td style={{padding:"9px 12px",color:i<2?"#50e080":"#8899bb",fontWeight:700}}>{i+1}</td>
                <td style={{padding:"9px 4px"}}><span style={{fontSize:16}}>{row.flag}</span> <span style={{fontWeight:600}}>{row.team}</span></td>
                <td style={{padding:"9px 6px",textAlign:"center",color:"#aab"}}>{row.p}</td>
                <td style={{padding:"9px 6px",textAlign:"center",color:"#50e080"}}>{row.w}</td>
                <td style={{padding:"9px 6px",textAlign:"center",color:"#aab"}}>{row.d}</td>
                <td style={{padding:"9px 6px",textAlign:"center",color:"#ff8060"}}>{row.l}</td>
                <td style={{padding:"9px 6px",textAlign:"center"}}>{row.gf}</td>
                <td style={{padding:"9px 6px",textAlign:"center"}}>{row.ga}</td>
                <td style={{padding:"9px 6px",textAlign:"center",color:row.gf-row.ga>0?"#50e080":row.gf-row.ga<0?"#ff8060":"#aab"}}>{row.gf-row.ga>0?"+":""}{row.gf-row.ga}</td>
                <td style={{padding:"9px 12px",textAlign:"center",fontWeight:900,fontSize:15,color:"#f0c040"}}>{row.pts}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{padding:"8px 12px",fontSize:11,color:"#667",borderTop:"1px solid rgba(255,255,255,.05)"}}>
          🟢 = {lang==="fa"?"صعود به مرحله بعد":"Advance to next round"}
        </div>
      </div>

      {/* Group matches */}
      <div style={{fontSize:11,color:"#8899bb",letterSpacing:2,fontWeight:700,margin:"14px 0 10px",textTransform:"uppercase"}}>── {t.groupLabel} {sel} {t.matches} ──</div>
      {groupMatches.map(m=>{
        const res=m.result.home!==""&&m.result.away!=="";
        return(
          <div key={m.id} className="card" style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px"}}>
            <div style={{flex:1,fontSize:13,fontWeight:600}}>{m.homeFlag} {m.home}</div>
            <div style={{textAlign:"center",minWidth:70}}>
              {res?<span style={{fontSize:18,fontWeight:900,color:"#f0c040"}}>{m.result.home} – {m.result.away}</span>:<span style={{fontSize:12,color:"#445"}}>{new Date(m.date).toLocaleDateString(lang==="fa"?"fa-IR":"en-GB",{timeZone:"Asia/Tehran",month:"short",day:"numeric"})}</span>}
            </div>
            <div style={{flex:1,fontSize:13,fontWeight:600,textAlign:"end"}}>{m.away} {m.awayFlag}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────
function LeaderboardTab({t,leaderboard,currentUser}){
  const medals=["🥇","🥈","🥉"];
  const me=leaderboard.find(e=>e.user===currentUser);
  return(
    <div>
      {me&&(
        <div className="card" style={{background:"linear-gradient(135deg,rgba(240,192,64,.1),rgba(240,150,20,.04))",border:"1px solid rgba(240,192,64,.25)",marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-around",textAlign:"center"}}>
            <div><div style={{fontSize:32,fontWeight:900,color:"#f0c040"}}>#{me.rank}</div><div style={{fontSize:11,color:"#8899bb"}}>{t.myRank}</div></div>
            <div><div style={{fontSize:32,fontWeight:900,color:"#fff"}}>{me.pts}</div><div style={{fontSize:11,color:"#8899bb"}}>{t.totalPoints}</div></div>
            <div><div style={{fontSize:32,fontWeight:900,color:"#6090ff"}}>{leaderboard.length}</div><div style={{fontSize:11,color:"#8899bb"}}>{t.totalPlayers}</div></div>
          </div>
        </div>
      )}
      {leaderboard.map((e,i)=>(
        <div key={e.user} className="card" style={{display:"flex",alignItems:"center",gap:14,padding:"12px 16px",background:e.user===currentUser?"rgba(240,192,64,.07)":"rgba(255,255,255,.03)",border:e.user===currentUser?"1px solid rgba(240,192,64,.28)":"1px solid rgba(255,255,255,.07)"}}>
          <div style={{width:34,textAlign:"center",fontSize:i<3?20:14,fontWeight:700,color:i<3?"#f0c040":"#556"}}>{i<3?medals[i]:`#${i+1}`}</div>
          <div style={{flex:1,fontWeight:600,fontSize:14}}>{e.user}</div>
          <div style={{textAlign:"center"}}>
            <div style={{fontWeight:900,fontSize:20,color:i===0?"#f0c040":i===1?"#b0c8e0":i===2?"#e0a060":"#e8eaf0"}}>{e.pts}</div>
            <div style={{fontSize:10,color:"#8899bb"}}>{t.pts}</div>
          </div>
        </div>
      ))}
      {leaderboard.length===0&&<div className="card" style={{textAlign:"center",color:"#8899bb",padding:40}}>🏆</div>}
    </div>
  );
}

// ─── MY PREDICTIONS ───────────────────────────────────────────────────────────
function MyPredsTab({t,matches,predictions,currentUser}){
  const myP=predictions[currentUser]||{};
  const done=matches.filter(m=>m.result.home!==""&&m.result.away!=="");
  const upcoming=matches.filter(m=>m.result.home===""||m.result.away==="");
  const totalPts=done.reduce((s,m)=>s+calcPoints(myP[m.id],m.result),0);
  const exact=done.filter(m=>calcPoints(myP[m.id],m.result)===10).length;

  return(
    <div>
      <div className="card" style={{background:"linear-gradient(135deg,rgba(96,144,255,.08),rgba(50,100,220,.04))",border:"1px solid rgba(96,144,255,.2)",marginBottom:16,display:"flex",justifyContent:"space-around",textAlign:"center",padding:"16px 12px"}}>
        <div><div style={{fontSize:28,fontWeight:900,color:"#f0c040"}}>{totalPts}</div><div style={{fontSize:11,color:"#8899bb"}}>{t.totalPoints}</div></div>
        <div><div style={{fontSize:28,fontWeight:900,color:"#50e080"}}>{exact}</div><div style={{fontSize:11,color:"#8899bb"}}>{t.exactScore}</div></div>
        <div><div style={{fontSize:28,fontWeight:900,color:"#6090ff"}}>{Object.keys(myP).length}</div><div style={{fontSize:11,color:"#8899bb"}}>{t.predicted}</div></div>
      </div>
      {done.map(m=>{
        const p=myP[m.id]; const pts=calcPoints(p,m.result);
        return(
          <div key={m.id} className="card" style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",flexWrap:"wrap"}}>
            <div style={{flex:1,minWidth:120,fontSize:13,fontWeight:600}}>{m.homeFlag} {m.home} vs {m.awayFlag} {m.away}</div>
            <div style={{textAlign:"center",minWidth:48}}><div style={{fontSize:10,color:"#8899bb"}}>{t.actual}</div><div style={{fontWeight:700,color:"#f0c040"}}>{m.result.home}–{m.result.away}</div></div>
            <div style={{textAlign:"center",minWidth:48}}><div style={{fontSize:10,color:"#8899bb"}}>{t.prediction}</div><div style={{fontWeight:700,color:"#aab"}}>{p?`${p.home}–${p.away}`:"—"}</div></div>
            <span className={`pts-pill ${ptsCls(pts)}`} style={{fontSize:13,padding:"3px 12px"}}>{pts}</span>
          </div>
        );
      })}
      {upcoming.length>0&&<>
        <div style={{margin:"16px 0 10px",color:"#8899bb",fontSize:11,letterSpacing:2}}>── {t.upcoming.toUpperCase()} ──</div>
        {upcoming.map(m=>{const p=myP[m.id]; return(
          <div key={m.id} className="card" style={{display:"flex",alignItems:"center",gap:10,padding:"9px 14px",opacity:.6}}>
            <div style={{flex:1,fontSize:13}}>{m.homeFlag} {m.home} vs {m.awayFlag} {m.away}</div>
            <div style={{fontSize:12,color:p?"#f0c040":"#445"}}>{p?`📌 ${p.home}–${p.away}`:`— ${t.notPredicted}`}</div>
          </div>
        );})}
      </>}
    </div>
  );
}

// ─── ADMIN TAB ────────────────────────────────────────────────────────────────
function AdminTab({t,lang,matches,saveMatches,users,saveUsers,predictions,savePreds,showToast}){
  const [section,setSection]=useState("matches");
  const [showAdd,setShowAdd]=useState(false);
  const [editResult,setEditResult]=useState(null);
  const [resVal,setResVal]=useState({home:"",away:""});
  const [nm,setNm]=useState({home:"",away:"",homeFlag:"",awayFlag:"",date:"",stage:"group",group:""});
  const stages=["group","round32","round16","quarter","semi","third","final"];
  const pending=matches.filter(m=>new Date(m.date)<=new Date()&&(m.result.home===""||m.result.away==="")).length;

  const addMatch=async()=>{
    if(!nm.home||!nm.away||!nm.date) return;
    await saveMatches([...matches,{...nm,id:"m"+Date.now(),result:{home:"",away:""}}]);
    setNm({home:"",away:"",homeFlag:"",awayFlag:"",date:"",stage:"group",group:""}); setShowAdd(false); showToast(t.matchAdded);
  };
  const openRes=m=>{setResVal({home:m.result.home||"",away:m.result.away||""});setEditResult(m);};
  const saveRes=async()=>{
    await saveMatches(matches.map(m=>m.id===editResult.id?{...m,result:resVal}:m));
    setEditResult(null); showToast(t.resultSaved);
  };
  const delMatch=async id=>{if(!confirm(t.confirmDelete))return;await saveMatches(matches.filter(m=>m.id!==id));};
  const delUser=async u=>{
    if(!confirm(t.confirmDelete))return;
    const nu={...users};delete nu[u];const np={...predictions};delete np[u];
    await saveUsers(nu);await savePreds(np);
  };

  return(
    <div>
      {pending>0&&<div style={{background:"rgba(255,100,50,.1)",border:"1px solid rgba(255,100,50,.3)",borderRadius:10,padding:"10px 16px",marginBottom:14,fontSize:13,color:"#ff9060"}}>⚠️ {pending} {t.pendingResults}</div>}
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {["matches","users"].map(s=>(
          <button key={s} onClick={()=>setSection(s)} className="btn" style={{fontFamily:"inherit",background:section===s?"linear-gradient(135deg,#f0c040,#e08020)":"rgba(255,255,255,.08)",color:section===s?"#0a0f1e":"#aab",border:"none"}}>
            {s==="matches"?`⚽ ${t.matches}`:`👥 ${t.userManagement}`}
          </button>
        ))}
      </div>

      {section==="matches"&&<>
        <button className="btn btn-primary" style={{marginBottom:12,fontFamily:"inherit"}} onClick={()=>setShowAdd(!showAdd)}>{showAdd?"✕ "+t.cancel:"＋ "+t.addMatch}</button>
        {showAdd&&(
          <div className="card" style={{marginBottom:12,background:"rgba(240,192,64,.04)",border:"1px solid rgba(240,192,64,.2)"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
              <input className="inp" placeholder={`${t.home} (e.g. Iran)`} value={nm.home} onChange={e=>setNm(v=>({...v,home:e.target.value}))}/>
              <input className="inp" placeholder={`${t.away} (e.g. Brazil)`} value={nm.away} onChange={e=>setNm(v=>({...v,away:e.target.value}))}/>
              <input className="inp" placeholder="🏳️ Home flag emoji" value={nm.homeFlag} onChange={e=>setNm(v=>({...v,homeFlag:e.target.value}))}/>
              <input className="inp" placeholder="🏳️ Away flag emoji" value={nm.awayFlag} onChange={e=>setNm(v=>({...v,awayFlag:e.target.value}))}/>
              <input className="inp" type="datetime-local" value={nm.date} onChange={e=>setNm(v=>({...v,date:e.target.value}))}/>
              <select className="inp" value={nm.stage} onChange={e=>setNm(v=>({...v,stage:e.target.value}))}>
                {stages.map(s=><option key={s} value={s}>{stageLabel(s,t)}</option>)}
              </select>
              <input className="inp" placeholder="Group (A–L)" value={nm.group} onChange={e=>setNm(v=>({...v,group:e.target.value.toUpperCase()}))}/>
            </div>
            <button className="btn btn-primary" onClick={addMatch} style={{fontFamily:"inherit"}}>{t.save}</button>
          </div>
        )}
        {STAGE_ORDER.map(stage=>{
          const sm=matches.filter(m=>m.stage===stage); if(!sm.length) return null;
          return(
            <div key={stage}>
              <div style={{fontSize:11,color:"#8899bb",letterSpacing:2,fontWeight:700,margin:"14px 0 8px",textTransform:"uppercase"}}>── {stageLabel(stage,t)} ──</div>
              {sm.map(m=>(
                <div key={m.id} className="card" style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",padding:"11px 14px"}}>
                  <div style={{flex:1,minWidth:160}}>
                    <div style={{fontWeight:600,fontSize:13}}>{m.homeFlag} {m.home} vs {m.awayFlag} {m.away}</div>
                    <div style={{fontSize:11,color:"#8899bb",marginTop:2}}>{new Date(m.date).toLocaleString(lang==="fa"?"fa-IR":"en-GB",{timeZone:"Asia/Tehran",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}{m.group?` · ${t.groupLabel} ${m.group}`:""}</div>
                  </div>
                  {m.result.home!==""?<span className="badge badge-green">{m.result.home} – {m.result.away}</span>:<span className="badge badge-blue">—</span>}
                  <button className="btn btn-ghost" style={{padding:"5px 11px",fontSize:12,fontFamily:"inherit"}} onClick={()=>openRes(m)}>{t.setResult}</button>
                  <button className="btn btn-danger" style={{padding:"5px 10px",fontSize:12,fontFamily:"inherit"}} onClick={()=>delMatch(m.id)}>✕</button>
                </div>
              ))}
            </div>
          );
        })}
      </>}

      {section==="users"&&(
        <div>
          <div style={{fontSize:12,color:"#8899bb",marginBottom:10}}>👥 {Object.keys(users).length} {lang==="fa"?"کاربر":"users"}</div>
          {Object.entries(users).map(([uname])=>{
            const pts=matches.reduce((s,m)=>m.result.home!==""?s+calcPoints(predictions[uname]?.[m.id],m.result):s,0);
            return(
              <div key={uname} className="card" style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{flex:1}}><div style={{fontWeight:600}}>👤 {uname}</div><div style={{fontSize:11,color:"#8899bb"}}>{pts} {t.pts}</div></div>
                <button className="btn btn-danger" style={{padding:"5px 11px",fontSize:12,fontFamily:"inherit"}} onClick={()=>delUser(uname)}>{t.deleteUser}</button>
              </div>
            );
          })}
          {Object.keys(users).length===0&&<div className="card" style={{textAlign:"center",color:"#8899bb",padding:30}}>👥</div>}
        </div>
      )}

      {editResult&&(
        <Modal onClose={()=>setEditResult(null)}>
          <div style={{textAlign:"center",marginBottom:14,fontWeight:700,fontSize:14}}>{editResult.homeFlag} {editResult.home} vs {editResult.awayFlag} {editResult.away}</div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:18,margin:"16px 0"}}>
            <div style={{textAlign:"center"}}><div style={{fontSize:11,color:"#8899bb",marginBottom:6}}>{editResult.home}</div><input type="number" min="0" max="20" className="score-input" value={resVal.home} onChange={e=>setResVal(v=>({...v,home:e.target.value}))}/></div>
            <div style={{fontSize:24,color:"#f0c040",fontWeight:900}}>–</div>
            <div style={{textAlign:"center"}}><div style={{fontSize:11,color:"#8899bb",marginBottom:6}}>{editResult.away}</div><input type="number" min="0" max="20" className="score-input" value={resVal.away} onChange={e=>setResVal(v=>({...v,away:e.target.value}))}/></div>
          </div>
          <div style={{display:"flex",gap:8,marginTop:14}}>
            <button className="btn btn-ghost" style={{flex:1,fontFamily:"inherit"}} onClick={()=>setEditResult(null)}>{t.cancel}</button>
            <button className="btn btn-primary" style={{flex:1,fontFamily:"inherit"}} onClick={saveRes}>{t.save}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function TeamCell({flag,name}){return(<div style={{flex:1,textAlign:"center"}}><div style={{fontSize:28}}>{flag||"🏳️"}</div><div style={{fontWeight:700,fontSize:12,marginTop:3}}>{name}</div></div>);}
function StageDivider({label}){return(<div style={{display:"flex",alignItems:"center",gap:10,margin:"18px 0 10px",color:"#8899bb",fontSize:11,letterSpacing:2,fontWeight:700}}><div style={{flex:1,height:1,background:"rgba(255,255,255,.07)"}}/><span style={{textTransform:"uppercase"}}>{label}</span><div style={{flex:1,height:1,background:"rgba(255,255,255,.07)"}}/></div>);}
function Modal({children,onClose}){return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.72)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}><div style={{background:"linear-gradient(135deg,#0f1a2e,#0a1222)",border:"1px solid rgba(240,192,64,.25)",borderRadius:16,padding:"24px 20px",width:"100%",maxWidth:360,animation:"slideDown .22s ease"}}>{children}</div></div>);}
function Loader(){return(<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#050d1a",color:"#f0c040",fontSize:22,fontFamily:"sans-serif",gap:12}}><span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>⚽</span> Loading…</div>);}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@400;600;700;900&family=Vazirmatn:wght@400;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-track{background:#050d1a;}::-webkit-scrollbar-thumb{background:#f0c040;border-radius:3px;}
.tab-btn{background:transparent;border:none;color:#8899bb;cursor:pointer;padding:10px 14px;font-size:13px;border-bottom:3px solid transparent;transition:all .2s;white-space:nowrap;font-family:inherit;}
.tab-btn.active{color:#f0c040;border-bottom-color:#f0c040;}
.filter-btn{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#8899bb;border-radius:20px;padding:5px 14px;font-size:12px;cursor:pointer;transition:all .2s;font-family:inherit;}
.filter-btn.active{background:rgba(240,192,64,.15);border-color:rgba(240,192,64,.4);color:#f0c040;}
.card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:15px;margin-bottom:10px;transition:border-color .2s;}
.btn{border:none;border-radius:8px;padding:10px 20px;cursor:pointer;font-weight:600;font-size:14px;transition:all .2s;}
.btn.sm{padding:5px 12px;font-size:12px;}
.btn-primary{background:linear-gradient(135deg,#f0c040,#e08020);color:#0a0f1e;}
.btn-primary:hover{transform:translateY(-1px);box-shadow:0 4px 16px rgba(240,192,64,.3);}
.btn-danger{background:rgba(220,50,50,.15);color:#ff6b6b;border:1px solid rgba(220,50,50,.25);}
.btn-ghost{background:rgba(255,255,255,.07);color:#ccd;border:1px solid rgba(255,255,255,.12);}
.inp{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.13);border-radius:8px;padding:10px 14px;color:#e8eaf0;font-size:14px;width:100%;outline:none;transition:border-color .2s;font-family:inherit;}
.inp:focus{border-color:#f0c040;}
.badge{display:inline-block;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600;}
.badge-gold{background:rgba(240,192,64,.17);color:#f0c040;border:1px solid rgba(240,192,64,.28);}
.badge-green{background:rgba(50,200,100,.17);color:#50e080;border:1px solid rgba(50,200,100,.28);}
.badge-red{background:rgba(220,80,50,.17);color:#ff8060;border:1px solid rgba(220,80,50,.28);}
.badge-blue{background:rgba(50,100,220,.17);color:#6090ff;border:1px solid rgba(50,100,220,.28);}
.score-input{width:56px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);border-radius:8px;padding:8px;color:#fff;font-size:22px;font-weight:700;text-align:center;outline:none;}
.score-input:focus{border-color:#f0c040;}
.pts-pill{padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;}
.pts-10{background:rgba(240,192,64,.2);color:#f0c040;}
.pts-7{background:rgba(100,200,255,.17);color:#64c8ff;}
.pts-5{background:rgba(50,200,100,.17);color:#50e080;}
.pts-2{background:rgba(200,100,50,.17);color:#e08050;}
.pts-0{background:rgba(150,150,150,.11);color:#778;}
.toast{position:fixed;bottom:52px;right:16px;background:linear-gradient(135deg,#1a2f1a,#162614);border:1px solid #50e080;color:#50e080;padding:11px 20px;border-radius:10px;z-index:999;font-weight:600;font-size:14px;animation:toastAnim 2.8s ease forwards;}
@keyframes toastAnim{0%{transform:translateX(120%);opacity:0}12%{transform:translateX(0);opacity:1}80%{transform:translateX(0);opacity:1}100%{transform:translateX(120%);opacity:0}}
@keyframes slideDown{from{transform:translateY(-18px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
.animate-in{animation:fadeIn .3s ease;}
`;
