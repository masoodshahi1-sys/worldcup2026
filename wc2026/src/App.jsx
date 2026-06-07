import { useState, useEffect } from "react";
import { db } from "./firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

// ─── TRANSLATIONS ─────────────────────────────────────────────────────────────
const T = {
  fa: {
    dir:"rtl", appTitle:"جام‌جهانی ۲۰۲۶", appSubtitle:"پیش‌بینی مسابقات",
    login:"ورود", register:"ثبت‌نام", logout:"خروج",
    username:"نام کاربری", password:"رمز عبور", confirmPassword:"تکرار رمز",
    matches:"بازی‌ها", leaderboard:"جدول", myPredictions:"پیش‌بینی‌های من",
    adminPanel:"پنل ادمین", champion:"قهرمان", predict:"پیش‌بینی",
    save:"ذخیره", cancel:"انصراف",
    totalPoints:"کل امتیاز", predicted:"پیش‌بینی شده", notPredicted:"پیش‌بینی نشده",
    upcoming:"پیش‌رو", finished:"پایان",
    group:"مرحله گروهی", round32:"یک‌شانزدهم", round16:"یک‌هشتم",
    quarter:"یک‌چهارم", semi:"نیمه‌نهایی", third:"رده‌بندی سوم", final:"فینال",
    setResult:"ثبت نتیجه", addMatch:"افزودن بازی",
    userManagement:"مدیریت کاربران", deleteUser:"حذف",
    usernameExists:"این نام کاربری قبلاً ثبت شده",
    wrongCredentials:"نام کاربری یا رمز اشتباه است",
    passwordMismatch:"رمزها یکسان نیستند", fillAll:"لطفاً همه فیلدها را پر کنید",
    exactScore:"نتیجه دقیق", correctDiff:"اختلاف گل صحیح",
    correctWinner:"برنده صحیح", wrongResult:"نتیجه اشتباه",
    noPrediction:"عدم پیش‌بینی", pts:"امتیاز", switchLang:"EN",
    noMatches:"هنوز بازی‌ای ثبت نشده",
    matchAdded:"بازی اضافه شد", resultSaved:"نتیجه ثبت شد",
    predictionSaved:"پیش‌بینی ذخیره شد",
    predictionLocked:"⏰ مهلت پیش‌بینی این بازی تمام شده",
    confirmDelete:"آیا مطمئنید؟",
    myRank:"رتبه من", totalPlayers:"تعداد بازیکنان",
    prediction:"پیش‌بینی", actual:"نتیجه",
    lockedBadge:"قفل شده", groupLabel:"گروه", allGroups:"همه گروه‌ها",
    editPrediction:"ویرایش", groupStandings:"جدول گروه‌ها",
    played:"بازی", won:"برد", drawn:"مساوی", lost:"باخت",
    gf:"گل زده", ga:"گل خورده", pts2:"امتیاز", team:"تیم",
    pendingResults:"بازی منتظر ثبت نتیجه",
    // Knockout
    advanceMethod:"روش صعود", min90:"۹۰ دقیقه", extraTime:"وقت اضافه", penalty:"پنالتی",
    bonusAdvance:"+۳ تیم صعودکننده صحیح", bonusMethod:"+۲ روش صعود صحیح",
    knockoutRules:"قوانین مرحله حذفی",
    // Champion
    championTitle:"پیش‌بینی قهرمان", championDeadline:"مهلت تا سوت افتتاحیه",
    championPick:"تیم قهرمان خود را انتخاب کنید",
    championPredictions:"پیش‌بینی قهرمان — همه کاربران",
    championPoints:"۳۰ امتیاز برای پیش‌بینی درست",
    yourChampionPick:"پیش‌بینی شما", alreadyPicked:"پیش‌بینی ثبت شده",
    championLocked:"مهلت پیش‌بینی قهرمان تمام شده",
    championCorrect:"🏆 قهرمان پیش‌بینی شما درست بود! +۳۰ امتیاز",
    setChampion:"ثبت قهرمان واقعی", actualChampion:"قهرمان واقعی",
    noChampionSet:"هنوز قهرمان ثبت نشده",
  },
  en: {
    dir:"ltr", appTitle:"World Cup 2026", appSubtitle:"Match Predictions",
    login:"Login", register:"Register", logout:"Logout",
    username:"Username", password:"Password", confirmPassword:"Confirm Password",
    matches:"Matches", leaderboard:"Leaderboard", myPredictions:"My Predictions",
    adminPanel:"Admin Panel", champion:"Champion", predict:"Predict",
    save:"Save", cancel:"Cancel",
    totalPoints:"Total Points", predicted:"Predicted", notPredicted:"Not Predicted",
    upcoming:"Upcoming", finished:"Finished",
    group:"Group Stage", round32:"Round of 32", round16:"Round of 16",
    quarter:"Quarterfinal", semi:"Semifinal", third:"3rd Place", final:"Final",
    setResult:"Set Result", addMatch:"Add Match",
    userManagement:"Users", deleteUser:"Delete",
    usernameExists:"Username already taken",
    wrongCredentials:"Wrong username or password",
    passwordMismatch:"Passwords don't match", fillAll:"Please fill all fields",
    exactScore:"Exact Score", correctDiff:"Correct Goal Diff",
    correctWinner:"Correct Winner", wrongResult:"Wrong Result",
    noPrediction:"No Prediction", pts:"pts", switchLang:"فا",
    noMatches:"No matches added yet",
    matchAdded:"Match added", resultSaved:"Result saved",
    predictionSaved:"Prediction saved",
    predictionLocked:"⏰ Prediction deadline has passed",
    confirmDelete:"Are you sure?",
    myRank:"My Rank", totalPlayers:"Players",
    prediction:"Prediction", actual:"Result",
    lockedBadge:"Locked", groupLabel:"Group", allGroups:"All Groups",
    editPrediction:"Edit", groupStandings:"Group Standings",
    played:"P", won:"W", drawn:"D", lost:"L",
    gf:"GF", ga:"GA", pts2:"Pts", team:"Team",
    pendingResults:"matches awaiting result",
    // Knockout
    advanceMethod:"Advance Method", min90:"90 min", extraTime:"Extra Time", penalty:"Penalty",
    bonusAdvance:"+3 Correct winner", bonusMethod:"+2 Correct method",
    knockoutRules:"Knockout Bonus Rules",
    // Champion
    championTitle:"Champion Prediction", championDeadline:"Deadline: before opening match",
    championPick:"Pick your champion",
    championPredictions:"Champion Picks — All Users",
    championPoints:"30 pts for correct prediction",
    yourChampionPick:"Your pick", alreadyPicked:"Already picked",
    championLocked:"Champion prediction deadline passed",
    championCorrect:"🏆 Your champion prediction was correct! +30 pts",
    setChampion:"Set Actual Champion", actualChampion:"Actual Champion",
    noChampionSet:"Champion not set yet",
  },
};

// ─── SCORING ──────────────────────────────────────────────────────────────────
const OPENING_MATCH_DATE = "2026-06-11T23:00Z"; // first match kickoff

function isKnockout(stage) {
  return ["round32","round16","quarter","semi","third","final"].includes(stage);
}

function calcPoints(pred, actual, stage) {
  if (!pred || pred.home==="" || pred.away==="" || pred.home===undefined) return 0;
  if (!actual || actual.home==="" || actual.away==="") return 0;
  const ph=parseInt(pred.home), pa=parseInt(pred.away);
  const ah=parseInt(actual.home), aa=parseInt(actual.away);
  if (isNaN(ph)||isNaN(pa)||isNaN(ah)||isNaN(aa)) return 0;

  // Base points (same for all stages)
  let pts = 0;
  if (ph===ah && pa===aa) pts=10;
  else if (ph-pa===ah-aa) pts=7;
  else {
    const pw=ph>pa?"H":ph<pa?"A":"D";
    const aw=ah>aa?"H":ah<aa?"A":"D";
    pts = pw===aw ? 5 : 2;
  }

  // Knockout bonus
  if (isKnockout(stage) && actual.winner && pred.winner) {
    if (pred.winner===actual.winner) {
      pts += 3;
      if (pred.method && actual.method && pred.method===actual.method) pts += 2;
    }
  }
  return pts;
}

function calcChampionPoints(userPick, actualChampion) {
  if (!userPick || !actualChampion) return 0;
  return userPick === actualChampion ? 30 : 0;
}

function ptsCls(p){
  if(p>=13) return "pts-10";
  if(p>=10) return "pts-10";
  if(p===7||p===9) return "pts-7";
  if(p===5||p===6||p===8) return "pts-5";
  if(p===2||p===3||p===4) return "pts-2";
  return "pts-0";
}

// ─── GROUP STANDINGS ──────────────────────────────────────────────────────────
function calcGroupStandings(matches) {
  const groups={};
  matches.filter(m=>m.stage==="group").forEach(m=>{
    if(!groups[m.group]) groups[m.group]={};
    [m.home,m.away].forEach(team=>{
      if(!groups[m.group][team]) groups[m.group][team]={team,flag:team===m.home?m.homeFlag:m.awayFlag,p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0};
    });
    if(m.result.home===""||m.result.away==="") return;
    const ah=parseInt(m.result.home),aa=parseInt(m.result.away);
    const ht=groups[m.group][m.home],at=groups[m.group][m.away];
    ht.p++;at.p++;ht.gf+=ah;ht.ga+=aa;at.gf+=aa;at.ga+=ah;
    if(ah>aa){ht.w++;ht.pts+=3;at.l++;}
    else if(ah<aa){at.w++;at.pts+=3;ht.l++;}
    else{ht.d++;at.d++;ht.pts++;at.pts++;}
  });
  const sorted={};
  Object.entries(groups).forEach(([g,teams])=>{
    sorted[g]=Object.values(teams).sort((a,b)=>{
      if(b.pts!==a.pts) return b.pts-a.pts;
      const gd=(b.gf-b.ga)-(a.gf-a.ga); if(gd!==0) return gd;
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

const STAGE_ORDER=["group","round32","round16","quarter","semi","third","final"];
const sortByDate=arr=>[...arr].sort((a,b)=>new Date(a.date)-new Date(b.date));
const stageLabel=(s,t)=>({group:t.group,round32:t.round32,round16:t.round16,quarter:t.quarter,semi:t.semi,third:t.third,final:t.final}[s]||s);

// All 48 teams for champion picker
const ALL_TEAMS = [
  {name:"Argentina",flag:"🇦🇷"},{name:"Mexico",flag:"🇲🇽"},{name:"Poland",flag:"🇵🇱"},{name:"Saudi Arabia",flag:"🇸🇦"},
  {name:"USA",flag:"🇺🇸"},{name:"Canada",flag:"🇨🇦"},{name:"Jamaica",flag:"🇯🇲"},{name:"Panama",flag:"🇵🇦"},
  {name:"Morocco",flag:"🇲🇦"},{name:"Belgium",flag:"🇧🇪"},{name:"Ecuador",flag:"🇪🇨"},{name:"Ukraine",flag:"🇺🇦"},
  {name:"Iran",flag:"🇮🇷"},{name:"Portugal",flag:"🇵🇹"},{name:"Senegal",flag:"🇸🇳"},{name:"New Zealand",flag:"🇳🇿"},
  {name:"Germany",flag:"🇩🇪"},{name:"Spain",flag:"🇪🇸"},{name:"Japan",flag:"🇯🇵"},{name:"Australia",flag:"🇦🇺"},
  {name:"Brazil",flag:"🇧🇷"},{name:"Netherlands",flag:"🇳🇱"},{name:"Croatia",flag:"🇭🇷"},{name:"South Korea",flag:"🇰🇷"},
  {name:"France",flag:"🇫🇷"},{name:"England",flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿"},{name:"Nigeria",flag:"🇳🇬"},{name:"Algeria",flag:"🇩🇿"},
  {name:"Colombia",flag:"🇨🇴"},{name:"Uruguay",flag:"🇺🇾"},{name:"Turkey",flag:"🇹🇷"},{name:"Ivory Coast",flag:"🇨🇮"},
  {name:"Serbia",flag:"🇷🇸"},{name:"Switzerland",flag:"🇨🇭"},{name:"Denmark",flag:"🇩🇰"},{name:"Austria",flag:"🇦🇹"},
  {name:"Egypt",flag:"🇪🇬"},{name:"Mali",flag:"🇲🇱"},{name:"Ghana",flag:"🇬🇭"},{name:"Cameroon",flag:"🇨🇲"},
  {name:"Qatar",flag:"🇶🇦"},{name:"South Africa",flag:"🇿🇦"},{name:"Venezuela",flag:"🇻🇪"},{name:"Paraguay",flag:"🇵🇾"},
  {name:"Chile",flag:"🇨🇱"},{name:"Honduras",flag:"🇭🇳"},{name:"Costa Rica",flag:"🇨🇷"},{name:"El Salvador",flag:"🇸🇻"},
];

// ─── FIREBASE ─────────────────────────────────────────────────────────────────
async function fbSet(col,id,value){ await setDoc(doc(db,col,id),{value}); }

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App(){
  const [lang,setLang]=useState("fa");
  const t=T[lang];
  const [users,setUsers]=useState({});
  const [matches,setMatches]=useState([]);
  const [predictions,setPredictions]=useState({});
  const [championData,setChampionData]=useState({picks:{},actual:""});
  const [currentUser,setCurrentUser]=useState(null);
  const [tab,setTab]=useState("matches");
  const [authMode,setAuthMode]=useState("login");
  const [form,setForm]=useState({username:"",password:"",confirm:""});
  const [authError,setAuthError]=useState("");
  const [toast,setToast]=useState("");
  const [loading,setLoading]=useState(true);
  const ADMIN_PASS="admin2026";

  useEffect(()=>{
    const u1=onSnapshot(doc(db,"data","matches"),snap=>{
      if(snap.exists()) setMatches(sortByDate(snap.data().value));
      else{ setMatches(sortByDate(ALL_MATCHES)); fbSet("data","matches",ALL_MATCHES); }
    });
    const u2=onSnapshot(doc(db,"data","users"),snap=>{ setUsers(snap.exists()?snap.data().value:{}); });
    const u3=onSnapshot(doc(db,"data","predictions"),snap=>{ setPredictions(snap.exists()?snap.data().value:{}); });
    const u4=onSnapshot(doc(db,"data","champion"),snap=>{ setChampionData(snap.exists()?snap.data().value:{picks:{},actual:""}); });
    const sess=sessionStorage.getItem("wc26_user");
    if(sess) setCurrentUser(sess);
    setLoading(false);
    return()=>{u1();u2();u3();u4();};
  },[]);

  const showToast=msg=>{setToast(msg);setTimeout(()=>setToast(""),2800);};
  const saveUsers=async u=>{setUsers(u);await fbSet("data","users",u);};
  const saveMatches=async m=>{const s=sortByDate(m);setMatches(s);await fbSet("data","matches",s);};
  const savePreds=async p=>{setPredictions(p);await fbSet("data","predictions",p);};
  const saveChampion=async c=>{setChampionData(c);await fbSet("data","champion",c);};

  const handleAuth=async()=>{
    const{username,password,confirm}=form;
    if(!username.trim()||!password) return setAuthError(t.fillAll);
    if(username==="admin"){
      if(password!==ADMIN_PASS) return setAuthError(t.wrongCredentials);
      setCurrentUser("admin");sessionStorage.setItem("wc26_user","admin");setAuthError("");return;
    }
    if(authMode==="register"){
      if(password!==confirm) return setAuthError(t.passwordMismatch);
      if(users[username]) return setAuthError(t.usernameExists);
      const nu={...users,[username]:{password,createdAt:Date.now()}};
      await saveUsers(nu);
      setCurrentUser(username);sessionStorage.setItem("wc26_user",username);
      setAuthError("");setForm({username:"",password:"",confirm:""});
    } else {
      if(!users[username]||users[username].password!==password) return setAuthError(t.wrongCredentials);
      setCurrentUser(username);sessionStorage.setItem("wc26_user",username);
      setAuthError("");setForm({username:"",password:"",confirm:""});
    }
  };

  const logout=()=>{setCurrentUser(null);sessionStorage.removeItem("wc26_user");setTab("matches");};
  const isAdmin=currentUser==="admin";

  const getLeaderboard=()=>{
    const scores={};
    Object.keys(users).forEach(u=>{scores[u]=0;});
    // Match predictions
    matches.forEach(m=>{
      if(m.result.home===""||m.result.away==="") return;
      Object.keys(predictions).forEach(u=>{
        scores[u]=(scores[u]||0)+calcPoints(predictions[u]?.[m.id],m.result,m.stage);
      });
    });
    // Champion bonus
    if(championData.actual){
      Object.keys(users).forEach(u=>{
        scores[u]=(scores[u]||0)+calcChampionPoints(championData.picks[u],championData.actual);
      });
    }
    return Object.entries(scores).sort((a,b)=>b[1]-a[1]).map(([user,pts],i)=>({user,pts,rank:i+1}));
  };

  const groupStandings=calcGroupStandings(matches);

  if(loading) return <Loader/>;

  return(
    <div dir={t.dir} style={{minHeight:"100vh",background:"linear-gradient(135deg,#050d1a 0%,#0a1628 60%,#06101e 100%)",color:"#e8eaf0",fontFamily:lang==="fa"?"'Vazirmatn','Tahoma',sans-serif":"'Exo 2','Segoe UI',sans-serif"}}>
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
                {["matches","champion","standings","leaderboard","myPredictions",...(isAdmin?["adminPanel"]:[])].map(k=>(
                  <button key={k} className={`tab-btn${tab===k?" active":""}`} onClick={()=>setTab(k)}>
                    {k==="matches"?"⚽ "+t.matches
                     :k==="champion"?"🏆 "+t.champion
                     :k==="standings"?"📊 "+t.groupStandings
                     :k==="leaderboard"?"🥇 "+t.leaderboard
                     :k==="myPredictions"?"📋 "+t.myPredictions
                     :"⚙️ "+t.adminPanel}
                  </button>
                ))}
              </div>
              <div className="animate-in">
                {tab==="matches"       && <MatchesTab t={t} lang={lang} matches={matches} predictions={predictions} currentUser={currentUser} savePreds={savePreds} showToast={showToast}/>}
                {tab==="champion"      && <ChampionTab t={t} lang={lang} currentUser={currentUser} championData={championData} saveChampion={saveChampion} showToast={showToast} isAdmin={isAdmin}/>}
                {tab==="standings"     && <StandingsTab t={t} lang={lang} standings={groupStandings} matches={matches}/>}
                {tab==="leaderboard"   && <LeaderboardTab t={t} leaderboard={getLeaderboard()} currentUser={currentUser} championData={championData}/>}
                {tab==="myPredictions" && <MyPredsTab t={t} matches={matches} predictions={predictions} currentUser={currentUser} championData={championData}/>}
                {tab==="adminPanel"&&isAdmin&&<AdminTab t={t} lang={lang} matches={matches} saveMatches={saveMatches} users={users} saveUsers={saveUsers} predictions={predictions} savePreds={savePreds} championData={championData} saveChampion={saveChampion} showToast={showToast}/>}
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
        <span className="pts-pill pts-ko">+3+2: {t.knockoutRules}</span>
        <span className="pts-pill pts-champ">🏆30: {t.champion}</span>
      </div>
    </div>
  );
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
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

// ─── CHAMPION TAB ─────────────────────────────────────────────────────────────
function ChampionTab({t,lang,currentUser,championData,saveChampion,showToast,isAdmin}){
  const [search,setSearch]=useState("");
  const openingPassed=new Date()>=new Date(OPENING_MATCH_DATE);
  const myPick=championData.picks[currentUser];
  const actual=championData.actual;

  const pickChampion=async(teamName)=>{
    if(openingPassed&&!isAdmin) return showToast(t.championLocked);
    if(myPick&&!isAdmin) return; // can't change after picking
    const nc={...championData,picks:{...championData.picks,[currentUser]:teamName}};
    await saveChampion(nc);
    showToast(t.predictionSaved);
  };

  const filtered=ALL_TEAMS.filter(t=>t.name.toLowerCase().includes(search.toLowerCase()));

  return(
    <div>
      {/* Champion card */}
      <div className="card" style={{background:"linear-gradient(135deg,rgba(240,192,64,.12),rgba(180,120,0,.06))",border:"1px solid rgba(240,192,64,.3)",marginBottom:16,textAlign:"center",padding:"20px 16px"}}>
        <div style={{fontSize:40,marginBottom:8}}>🏆</div>
        <div style={{fontWeight:900,fontSize:18,color:"#f0c040",marginBottom:4}}>{t.championTitle}</div>
        <div style={{fontSize:12,color:"#8899bb",marginBottom:12}}>{t.championDeadline} · {t.championPoints}</div>
        {actual&&(
          <div style={{background:"rgba(80,224,128,.1)",border:"1px solid rgba(80,224,128,.3)",borderRadius:10,padding:"10px 16px",marginBottom:12}}>
            <div style={{fontSize:11,color:"#8899bb",marginBottom:4}}>{t.actualChampion}</div>
            <div style={{fontSize:22,fontWeight:900,color:"#50e080"}}>
              {ALL_TEAMS.find(t=>t.name===actual)?.flag} {actual}
            </div>
          </div>
        )}
        {myPick?(
          <div style={{background:"rgba(96,144,255,.1)",border:"1px solid rgba(96,144,255,.25)",borderRadius:10,padding:"10px 16px"}}>
            <div style={{fontSize:11,color:"#8899bb",marginBottom:4}}>{t.yourChampionPick}</div>
            <div style={{fontSize:20,fontWeight:700,color:actual&&myPick===actual?"#50e080":"#6090ff"}}>
              {ALL_TEAMS.find(tm=>tm.name===myPick)?.flag} {myPick}
              {actual&&myPick===actual&&<span style={{marginRight:8,marginLeft:8}}>✓ +30</span>}
            </div>
          </div>
        ):(
          !openingPassed&&<div style={{fontSize:13,color:"#f0c040"}}>👇 {t.championPick}</div>
        )}
      </div>

      {/* Team picker — only show if not picked and deadline not passed */}
      {!myPick&&!openingPassed&&(
        <div className="card" style={{marginBottom:16}}>
          <input className="inp" placeholder="🔍 Search team..." value={search} onChange={e=>setSearch(e.target.value)} style={{marginBottom:12}}/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:8,maxHeight:320,overflowY:"auto"}}>
            {filtered.map(team=>(
              <button key={team.name} onClick={()=>pickChampion(team.name)} style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,padding:"10px 8px",cursor:"pointer",color:"#e8eaf0",fontSize:13,fontWeight:600,fontFamily:"inherit",transition:"all .2s",textAlign:"center"}}>
                <div style={{fontSize:24,marginBottom:4}}>{team.flag}</div>
                <div>{team.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* All users' picks */}
      <div style={{fontSize:11,color:"#8899bb",letterSpacing:2,fontWeight:700,margin:"16px 0 10px",textTransform:"uppercase"}}>── {t.championPredictions} ──</div>
      {Object.entries(championData.picks).length===0&&(
        <div className="card" style={{textAlign:"center",color:"#8899bb",padding:30}}>🏆</div>
      )}
      {Object.entries(championData.picks).map(([user,pick])=>{
        const correct=actual&&pick===actual;
        return(
          <div key={user} className="card" style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",background:correct?"rgba(80,224,128,.06)":"rgba(255,255,255,.03)",border:correct?"1px solid rgba(80,224,128,.25)":user===currentUser?"1px solid rgba(240,192,64,.2)":"1px solid rgba(255,255,255,.07)"}}>
            <div style={{flex:1}}>
              <div style={{fontWeight:600,fontSize:13}}>{user===currentUser?"👤 "+user+" ("+t.yourChampionPick+")":user}</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:20}}>{ALL_TEAMS.find(tm=>tm.name===pick)?.flag}</span>
              <span style={{fontWeight:700,fontSize:14,color:correct?"#50e080":user===currentUser?"#f0c040":"#e8eaf0"}}>{pick}</span>
              {correct&&<span className="badge badge-green">+30</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── MATCHES TAB ──────────────────────────────────────────────────────────────
function MatchesTab({t,lang,matches,predictions,currentUser,savePreds,showToast}){
  const [predModal,setPredModal]=useState(null);
  const [predVal,setPredVal]=useState({home:"",away:"",winner:"",method:""});
  const [filterGroup,setFilterGroup]=useState("all");

  const isLocked=m=>new Date(m.date)<=new Date();
  const hasResult=m=>m.result.home!==""&&m.result.away!=="";

  const openPred=m=>{
    if(isLocked(m)) return showToast(t.predictionLocked);
    const ex=predictions[currentUser]?.[m.id];
    setPredVal(ex||{home:"",away:"",winner:"",method:""});
    setPredModal(m);
  };
  const savePred=async()=>{
    if(predVal.home===""||predVal.away==="") return;
    if(isKnockout(predModal.stage)&&!predVal.winner) return;
    await savePreds({...predictions,[currentUser]:{...(predictions[currentUser]||{}),[predModal.id]:predVal}});
    setPredModal(null);showToast(t.predictionSaved);
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

      {STAGE_ORDER.map(stage=>{
        const sm=byStage[stage];if(!sm?.length) return null;
        const ko=isKnockout(stage);
        return(
          <div key={stage}>
            <StageDivider label={stageLabel(stage,t)}/>
            {ko&&<div style={{background:"rgba(240,192,64,.07)",border:"1px solid rgba(240,192,64,.15)",borderRadius:8,padding:"8px 14px",marginBottom:10,fontSize:12,color:"#f0c040"}}>
              ⭐ {t.bonusAdvance} · {t.bonusMethod}
            </div>}
            {sm.map(m=>{
              const myP=predictions[currentUser]?.[m.id];
              const pts=hasResult(m)?calcPoints(myP,m.result,m.stage):null;
              const locked=isLocked(m);const res=hasResult(m);
              return(
                <div key={m.id} className="card" style={{borderColor:res?"rgba(80,224,128,.15)":locked?"rgba(255,255,255,.06)":"rgba(240,192,64,.15)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:6}}>
                    <div style={{display:"flex",gap:6,alignItems:"center"}}>
                      {res&&<span className="badge badge-green">✓ {t.finished}</span>}
                      {!res&&locked&&<span className="badge badge-red">🔒 {t.lockedBadge}</span>}
                      {!res&&!locked&&<span className="badge badge-blue">⏰ {t.upcoming}</span>}
                      {m.group&&<span className="badge badge-gold">{t.groupLabel} {m.group}</span>}
                      {ko&&<span className="badge" style={{background:"rgba(240,192,64,.15)",color:"#f0c040",border:"1px solid rgba(240,192,64,.25)"}}>⭐ KO</span>}
                    </div>
                    <span style={{fontSize:11,color:"#556"}}>{new Date(m.date).toLocaleString(lang==="fa"?"fa-IR":"en-GB",{timeZone:"Asia/Tehran",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}</span>
                  </div>

                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                    <TeamCell flag={m.homeFlag} name={m.home}/>
                    <div style={{textAlign:"center",minWidth:90}}>
                      {res?<div style={{fontSize:28,fontWeight:900,color:"#f0c040",letterSpacing:3}}>{m.result.home} – {m.result.away}</div>:<div style={{fontSize:16,color:"#334",fontWeight:700}}>VS</div>}
                      {res&&m.result.winner&&<div style={{fontSize:11,color:"#8899bb",marginTop:2}}>{m.result.method==="penalty"?"🥅 "+t.penalty:m.result.method==="extra"?"⏱ "+t.extraTime:"90'"}</div>}
                      {pts!==null&&<div style={{marginTop:5}}><span className={`pts-pill ${ptsCls(pts)}`}>{pts} {t.pts}</span></div>}
                    </div>
                    <TeamCell flag={m.awayFlag} name={m.away}/>
                  </div>

                  <div style={{marginTop:12,paddingTop:10,borderTop:"1px solid rgba(255,255,255,.05)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{fontSize:12,color:"#8899bb"}}>
                      {myP?.home!==undefined
                        ?<span>📌 {t.prediction}: <strong style={{color:"#f0c040"}}>{myP.home}–{myP.away}</strong>{ko&&myP.winner&&<span style={{color:"#8899bb"}}> · {myP.winner} ({myP.method==="penalty"?t.penalty:myP.method==="extra"?t.extraTime:t.min90})</span>}</span>
                        :<span style={{color:"#445"}}>— {t.notPredicted}</span>}
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
          <div style={{textAlign:"center",marginBottom:14}}>
            <div style={{fontSize:11,color:"#8899bb",marginBottom:6}}>{isKnockout(predModal.stage)?"⭐ "+stageLabel(predModal.stage,t):"⚽ "+t.predict}</div>
            <div style={{fontWeight:700,fontSize:15}}>{predModal.homeFlag} {predModal.home} <span style={{color:"#334"}}>vs</span> {predModal.awayFlag} {predModal.away}</div>
          </div>

          {/* Score */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:18,margin:"16px 0"}}>
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

          {/* Knockout extras */}
          {isKnockout(predModal.stage)&&(
            <div style={{borderTop:"1px solid rgba(255,255,255,.08)",paddingTop:14,marginTop:4}}>
              <div style={{fontSize:12,color:"#f0c040",marginBottom:10,fontWeight:700}}>⭐ {t.bonusAdvance}</div>
              {/* Winner pick */}
              <div style={{fontSize:11,color:"#8899bb",marginBottom:8}}>{t.advanceMethod} — {t.correctWinner}:</div>
              <div style={{display:"flex",gap:8,marginBottom:12}}>
                {[{name:predModal.home,flag:predModal.homeFlag},{name:predModal.away,flag:predModal.awayFlag}].map(team=>(
                  <button key={team.name} onClick={()=>setPredVal(v=>({...v,winner:team.name}))} style={{flex:1,padding:"8px 4px",border:`1px solid ${predVal.winner===team.name?"#f0c040":"rgba(255,255,255,.15)"}`,borderRadius:8,background:predVal.winner===team.name?"rgba(240,192,64,.2)":"rgba(255,255,255,.05)",color:predVal.winner===team.name?"#f0c040":"#aab",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600}}>
                    {team.flag} {team.name}
                  </button>
                ))}
              </div>
              {/* Method pick */}
              {predVal.winner&&(
                <>
                  <div style={{fontSize:11,color:"#8899bb",marginBottom:8}}>{t.advanceMethod} (+2):</div>
                  <div style={{display:"flex",gap:6}}>
                    {[{key:"90min",label:"90' "+t.min90},{key:"extra",label:"⏱ "+t.extraTime},{key:"penalty",label:"🥅 "+t.penalty}].map(m=>(
                      <button key={m.key} onClick={()=>setPredVal(v=>({...v,method:m.key}))} style={{flex:1,padding:"7px 4px",border:`1px solid ${predVal.method===m.key?"#6090ff":"rgba(255,255,255,.12)"}`,borderRadius:8,background:predVal.method===m.key?"rgba(96,144,255,.2)":"rgba(255,255,255,.04)",color:predVal.method===m.key?"#6090ff":"#aab",cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:600}}>
                        {m.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div style={{display:"flex",gap:8,marginTop:16}}>
            <button className="btn btn-ghost" style={{flex:1,fontFamily:"inherit"}} onClick={()=>setPredModal(null)}>{t.cancel}</button>
            <button className="btn btn-primary" style={{flex:1,fontFamily:"inherit"}} onClick={savePred}>{t.save}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── STANDINGS TAB ────────────────────────────────────────────────────────────
function StandingsTab({t,lang,standings,matches}){
  const groups=Object.keys(standings).sort();
  const [sel,setSel]=useState(groups[0]||"A");
  if(groups.length===0) return <div className="card" style={{textAlign:"center",color:"#8899bb",padding:40}}>📊</div>;
  const gm=matches.filter(m=>m.stage==="group"&&m.group===sel);
  return(
    <div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
        {groups.map(g=><button key={g} className={`filter-btn${sel===g?" active":""}`} onClick={()=>setSel(g)}>{t.groupLabel} {g}</button>)}
      </div>
      <div className="card" style={{padding:0,overflow:"hidden",marginBottom:14}}>
        <div style={{padding:"10px 14px",background:"rgba(240,192,64,.07)",borderBottom:"1px solid rgba(255,255,255,.06)",fontWeight:700,fontSize:12,color:"#f0c040"}}>{t.groupLabel} {sel}</div>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead><tr style={{background:"rgba(255,255,255,.03)",color:"#8899bb",fontSize:11}}>
            <th style={{padding:"8px 12px",textAlign:"start"}}>#</th>
            <th style={{padding:"8px 4px",textAlign:"start"}}>{t.team}</th>
            <th style={{padding:"8px 6px",textAlign:"center"}}>{t.played}</th>
            <th style={{padding:"8px 6px",textAlign:"center"}}>{t.won}</th>
            <th style={{padding:"8px 6px",textAlign:"center"}}>{t.drawn}</th>
            <th style={{padding:"8px 6px",textAlign:"center"}}>{t.lost}</th>
            <th style={{padding:"8px 6px",textAlign:"center"}}>{t.gf}</th>
            <th style={{padding:"8px 6px",textAlign:"center"}}>{t.ga}</th>
            <th style={{padding:"8px 6px",textAlign:"center"}}>±</th>
            <th style={{padding:"8px 12px",textAlign:"center",color:"#f0c040"}}>{t.pts2}</th>
          </tr></thead>
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
        <div style={{padding:"7px 12px",fontSize:11,color:"#667",borderTop:"1px solid rgba(255,255,255,.05)"}}>🟢 = {lang==="fa"?"صعود":"Advance"}</div>
      </div>
      <div style={{fontSize:11,color:"#8899bb",letterSpacing:2,fontWeight:700,margin:"14px 0 8px",textTransform:"uppercase"}}>── {t.groupLabel} {sel} ──</div>
      {gm.map(m=>{const res=m.result.home!==""&&m.result.away!=="";return(
        <div key={m.id} className="card" style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px"}}>
          <div style={{flex:1,fontSize:13,fontWeight:600}}>{m.homeFlag} {m.home}</div>
          <div style={{textAlign:"center",minWidth:70}}>{res?<span style={{fontSize:18,fontWeight:900,color:"#f0c040"}}>{m.result.home} – {m.result.away}</span>:<span style={{fontSize:12,color:"#445"}}>{new Date(m.date).toLocaleDateString(lang==="fa"?"fa-IR":"en-GB",{timeZone:"Asia/Tehran",month:"short",day:"numeric"})}</span>}</div>
          <div style={{flex:1,fontSize:13,fontWeight:600,textAlign:"end"}}>{m.away} {m.awayFlag}</div>
        </div>
      );})}
    </div>
  );
}

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────
function LeaderboardTab({t,leaderboard,currentUser,championData}){
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
          <div style={{flex:1}}>
            <div style={{fontWeight:600,fontSize:14}}>{e.user}</div>
            {championData.picks[e.user]&&<div style={{fontSize:11,color:"#8899bb"}}>🏆 {championData.picks[e.user]}</div>}
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{fontWeight:900,fontSize:20,color:i===0?"#f0c040":i===1?"#b0c8e0":i===2?"#e0a060":"#e8eaf0"}}>{e.pts}</div>
            <div style={{fontSize:10,color:"#8899bb"}}>{t.pts}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── MY PREDICTIONS ───────────────────────────────────────────────────────────
function MyPredsTab({t,matches,predictions,currentUser,championData}){
  const myP=predictions[currentUser]||{};
  const done=matches.filter(m=>m.result.home!==""&&m.result.away!=="");
  const upcoming=matches.filter(m=>m.result.home===""||m.result.away==="");
  const totalPts=done.reduce((s,m)=>s+calcPoints(myP[m.id],m.result,m.stage),0)
    +calcChampionPoints(championData.picks[currentUser],championData.actual);
  const exact=done.filter(m=>calcPoints(myP[m.id],m.result,m.stage)===10).length;
  const myChamp=championData.picks[currentUser];
  const champPts=calcChampionPoints(myChamp,championData.actual);
  return(
    <div>
      <div className="card" style={{background:"linear-gradient(135deg,rgba(96,144,255,.08),rgba(50,100,220,.04))",border:"1px solid rgba(96,144,255,.2)",marginBottom:16,display:"flex",justifyContent:"space-around",textAlign:"center",padding:"16px 12px"}}>
        <div><div style={{fontSize:28,fontWeight:900,color:"#f0c040"}}>{totalPts}</div><div style={{fontSize:11,color:"#8899bb"}}>{t.totalPoints}</div></div>
        <div><div style={{fontSize:28,fontWeight:900,color:"#50e080"}}>{exact}</div><div style={{fontSize:11,color:"#8899bb"}}>{t.exactScore}</div></div>
        <div><div style={{fontSize:28,fontWeight:900,color:"#6090ff"}}>{Object.keys(myP).length}</div><div style={{fontSize:11,color:"#8899bb"}}>{t.predicted}</div></div>
      </div>
      {myChamp&&(
        <div className="card" style={{marginBottom:16,display:"flex",alignItems:"center",gap:12,background:"rgba(240,192,64,.06)",border:"1px solid rgba(240,192,64,.2)"}}>
          <div style={{fontSize:28}}>{ALL_TEAMS.find(tm=>tm.name===myChamp)?.flag}</div>
          <div style={{flex:1}}><div style={{fontWeight:700}}>{myChamp}</div><div style={{fontSize:11,color:"#8899bb"}}>{t.championTitle}</div></div>
          {champPts>0&&<span className="badge badge-green">+{champPts}</span>}
        </div>
      )}
      {done.map(m=>{
        const p=myP[m.id];const pts=calcPoints(p,m.result,m.stage);const ko=isKnockout(m.stage);
        return(
          <div key={m.id} className="card" style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",flexWrap:"wrap"}}>
            <div style={{flex:1,minWidth:120,fontSize:13,fontWeight:600}}>{m.homeFlag} {m.home} vs {m.awayFlag} {m.away}</div>
            <div style={{textAlign:"center",minWidth:48}}><div style={{fontSize:10,color:"#8899bb"}}>{t.actual}</div><div style={{fontWeight:700,color:"#f0c040"}}>{m.result.home}–{m.result.away}</div></div>
            <div style={{textAlign:"center",minWidth:48}}><div style={{fontSize:10,color:"#8899bb"}}>{t.prediction}</div><div style={{fontWeight:700,color:"#aab"}}>{p?`${p.home}–${p.away}`:"—"}</div></div>
            {ko&&p?.winner&&<div style={{fontSize:11,color:"#8899bb"}}>{p.winner}</div>}
            <span className={`pts-pill ${ptsCls(pts)}`} style={{fontSize:13,padding:"3px 12px"}}>{pts}</span>
          </div>
        );
      })}
      {upcoming.length>0&&<>
        <div style={{margin:"16px 0 10px",color:"#8899bb",fontSize:11,letterSpacing:2}}>── {t.upcoming.toUpperCase()} ──</div>
        {upcoming.map(m=>{const p=myP[m.id];return(
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
function AdminTab({t,lang,matches,saveMatches,users,saveUsers,predictions,savePreds,championData,saveChampion,showToast}){
  const [section,setSection]=useState("matches");
  const [showAdd,setShowAdd]=useState(false);
  const [editResult,setEditResult]=useState(null);
  const [resVal,setResVal]=useState({home:"",away:"",winner:"",method:""});
  const [nm,setNm]=useState({home:"",away:"",homeFlag:"",awayFlag:"",date:"",stage:"group",group:""});
  const [champSearch,setChampSearch]=useState("");
  const stages=["group","round32","round16","quarter","semi","third","final"];
  const pending=matches.filter(m=>new Date(m.date)<=new Date()&&(m.result.home===""||m.result.away==="")).length;

  const addMatch=async()=>{
    if(!nm.home||!nm.away||!nm.date) return;
    await saveMatches([...matches,{...nm,id:"m"+Date.now(),result:{home:"",away:""}}]);
    setNm({home:"",away:"",homeFlag:"",awayFlag:"",date:"",stage:"group",group:""});setShowAdd(false);showToast(t.matchAdded);
  };
  const openRes=m=>{
    setResVal({home:m.result.home||"",away:m.result.away||"",winner:m.result.winner||"",method:m.result.method||""});
    setEditResult(m);
  };
  const saveRes=async()=>{
    await saveMatches(matches.map(m=>m.id===editResult.id?{...m,result:resVal}:m));
    setEditResult(null);showToast(t.resultSaved);
  };
  const delMatch=async id=>{if(!confirm(t.confirmDelete))return;await saveMatches(matches.filter(m=>m.id!==id));};
  const delUser=async u=>{
    if(!confirm(t.confirmDelete))return;
    const nu={...users};delete nu[u];const np={...predictions};delete np[u];
    await saveUsers(nu);await savePreds(np);
  };
  const setActualChampion=async(name)=>{
    await saveChampion({...championData,actual:name});showToast(t.resultSaved);
  };

  const ko=editResult&&isKnockout(editResult.stage);
  const filteredTeams=ALL_TEAMS.filter(tm=>tm.name.toLowerCase().includes(champSearch.toLowerCase()));

  return(
    <div>
      {pending>0&&<div style={{background:"rgba(255,100,50,.1)",border:"1px solid rgba(255,100,50,.3)",borderRadius:10,padding:"10px 16px",marginBottom:14,fontSize:13,color:"#ff9060"}}>⚠️ {pending} {t.pendingResults}</div>}
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        {["matches","champion","users"].map(s=>(
          <button key={s} onClick={()=>setSection(s)} className="btn" style={{fontFamily:"inherit",background:section===s?"linear-gradient(135deg,#f0c040,#e08020)":"rgba(255,255,255,.08)",color:section===s?"#0a0f1e":"#aab",border:"none"}}>
            {s==="matches"?`⚽ ${t.matches}`:s==="champion"?`🏆 ${t.champion}`:`👥 ${t.userManagement}`}
          </button>
        ))}
      </div>

      {section==="champion"&&(
        <div>
          {championData.actual&&(
            <div className="card" style={{background:"rgba(80,224,128,.08)",border:"1px solid rgba(80,224,128,.25)",marginBottom:14,textAlign:"center",padding:"14px"}}>
              <div style={{fontSize:11,color:"#8899bb",marginBottom:4}}>{t.actualChampion}</div>
              <div style={{fontSize:22,fontWeight:900,color:"#50e080"}}>{ALL_TEAMS.find(tm=>tm.name===championData.actual)?.flag} {championData.actual}</div>
            </div>
          )}
          <div style={{fontSize:12,color:"#8899bb",marginBottom:10}}>{t.setChampion}:</div>
          <input className="inp" placeholder="🔍 Search..." value={champSearch} onChange={e=>setChampSearch(e.target.value)} style={{marginBottom:12}}/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:8,maxHeight:360,overflowY:"auto"}}>
            {filteredTeams.map(team=>(
              <button key={team.name} onClick={()=>setActualChampion(team.name)} style={{background:championData.actual===team.name?"rgba(80,224,128,.15)":"rgba(255,255,255,.06)",border:`1px solid ${championData.actual===team.name?"rgba(80,224,128,.4)":"rgba(255,255,255,.1)"}`,borderRadius:10,padding:"10px 8px",cursor:"pointer",color:championData.actual===team.name?"#50e080":"#e8eaf0",fontSize:13,fontWeight:600,fontFamily:"inherit",textAlign:"center"}}>
                <div style={{fontSize:22,marginBottom:4}}>{team.flag}</div>
                <div>{team.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {section==="matches"&&<>
        <button className="btn btn-primary" style={{marginBottom:12,fontFamily:"inherit"}} onClick={()=>setShowAdd(!showAdd)}>{showAdd?"✕ "+t.cancel:"＋ "+t.addMatch}</button>
        {showAdd&&(
          <div className="card" style={{marginBottom:12,background:"rgba(240,192,64,.04)",border:"1px solid rgba(240,192,64,.2)"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
              <input className="inp" placeholder={`${t.home}`} value={nm.home} onChange={e=>setNm(v=>({...v,home:e.target.value}))}/>
              <input className="inp" placeholder={`${t.away}`} value={nm.away} onChange={e=>setNm(v=>({...v,away:e.target.value}))}/>
              <input className="inp" placeholder="🏳️ Home flag" value={nm.homeFlag} onChange={e=>setNm(v=>({...v,homeFlag:e.target.value}))}/>
              <input className="inp" placeholder="🏳️ Away flag" value={nm.awayFlag} onChange={e=>setNm(v=>({...v,awayFlag:e.target.value}))}/>
              <input className="inp" type="datetime-local" value={nm.date} onChange={e=>setNm(v=>({...v,date:e.target.value}))}/>
              <select className="inp" value={nm.stage} onChange={e=>setNm(v=>({...v,stage:e.target.value}))}>
                {stages.map(s=><option key={s} value={s}>{stageLabel(s,t)}</option>)}
              </select>
              <input className="inp" placeholder="Group A–H (optional)" value={nm.group} onChange={e=>setNm(v=>({...v,group:e.target.value.toUpperCase()}))}/>
            </div>
            <button className="btn btn-primary" onClick={addMatch} style={{fontFamily:"inherit"}}>{t.save}</button>
          </div>
        )}
        {STAGE_ORDER.map(stage=>{
          const sm=matches.filter(m=>m.stage===stage);if(!sm.length) return null;
          return(
            <div key={stage}>
              <div style={{fontSize:11,color:"#8899bb",letterSpacing:2,fontWeight:700,margin:"14px 0 8px",textTransform:"uppercase"}}>── {stageLabel(stage,t)} ──</div>
              {sm.map(m=>(
                <div key={m.id} className="card" style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",padding:"11px 14px"}}>
                  <div style={{flex:1,minWidth:160}}>
                    <div style={{fontWeight:600,fontSize:13}}>{m.homeFlag} {m.home} vs {m.awayFlag} {m.away}</div>
                    <div style={{fontSize:11,color:"#8899bb",marginTop:2}}>{new Date(m.date).toLocaleString(lang==="fa"?"fa-IR":"en-GB",{timeZone:"Asia/Tehran",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}</div>
                  </div>
                  {m.result.home!==""?<span className="badge badge-green">{m.result.home}–{m.result.away}{m.result.winner?` · ${m.result.winner}`:""}</span>:<span className="badge badge-blue">—</span>}
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
          {Object.entries(users).map(([uname])=>{
            const pts=matches.reduce((s,m)=>m.result.home!==""?s+calcPoints(predictions[uname]?.[m.id],m.result,m.stage):s,0)
              +calcChampionPoints(championData.picks[uname],championData.actual);
            return(
              <div key={uname} className="card" style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600}}>👤 {uname}</div>
                  <div style={{fontSize:11,color:"#8899bb"}}>{pts} {t.pts} · 🏆 {championData.picks[uname]||"—"}</div>
                </div>
                <button className="btn btn-danger" style={{padding:"5px 11px",fontSize:12,fontFamily:"inherit"}} onClick={()=>delUser(uname)}>{t.deleteUser}</button>
              </div>
            );
          })}
        </div>
      )}

      {editResult&&(
        <Modal onClose={()=>setEditResult(null)}>
          <div style={{textAlign:"center",marginBottom:12,fontWeight:700,fontSize:14}}>{editResult.homeFlag} {editResult.home} vs {editResult.awayFlag} {editResult.away}</div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:18,margin:"14px 0"}}>
            <div style={{textAlign:"center"}}><div style={{fontSize:11,color:"#8899bb",marginBottom:6}}>{editResult.home}</div><input type="number" min="0" max="20" className="score-input" value={resVal.home} onChange={e=>setResVal(v=>({...v,home:e.target.value}))}/></div>
            <div style={{fontSize:24,color:"#f0c040",fontWeight:900}}>–</div>
            <div style={{textAlign:"center"}}><div style={{fontSize:11,color:"#8899bb",marginBottom:6}}>{editResult.away}</div><input type="number" min="0" max="20" className="score-input" value={resVal.away} onChange={e=>setResVal(v=>({...v,away:e.target.value}))}/></div>
          </div>
          {ko&&(
            <div style={{borderTop:"1px solid rgba(255,255,255,.08)",paddingTop:12,marginTop:4}}>
              <div style={{fontSize:11,color:"#8899bb",marginBottom:8}}>{t.correctWinner} (+3):</div>
              <div style={{display:"flex",gap:8,marginBottom:12}}>
                {[{name:editResult.home,flag:editResult.homeFlag},{name:editResult.away,flag:editResult.awayFlag}].map(team=>(
                  <button key={team.name} onClick={()=>setResVal(v=>({...v,winner:team.name}))} style={{flex:1,padding:"8px 4px",border:`1px solid ${resVal.winner===team.name?"#50e080":"rgba(255,255,255,.15)"}`,borderRadius:8,background:resVal.winner===team.name?"rgba(80,224,128,.15)":"rgba(255,255,255,.05)",color:resVal.winner===team.name?"#50e080":"#aab",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600}}>
                    {team.flag} {team.name}
                  </button>
                ))}
              </div>
              <div style={{fontSize:11,color:"#8899bb",marginBottom:8}}>{t.advanceMethod} (+2):</div>
              <div style={{display:"flex",gap:6}}>
                {[{key:"90min",label:"90'"},{key:"extra",label:"⏱ ET"},{key:"penalty",label:"🥅 PEN"}].map(m=>(
                  <button key={m.key} onClick={()=>setResVal(v=>({...v,method:m.key}))} style={{flex:1,padding:"7px 4px",border:`1px solid ${resVal.method===m.key?"#6090ff":"rgba(255,255,255,.12)"}`,borderRadius:8,background:resVal.method===m.key?"rgba(96,144,255,.2)":"rgba(255,255,255,.04)",color:resVal.method===m.key?"#6090ff":"#aab",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:600}}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div style={{display:"flex",gap:8,marginTop:16}}>
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
function Modal({children,onClose}){return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.72)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}><div style={{background:"linear-gradient(135deg,#0f1a2e,#0a1222)",border:"1px solid rgba(240,192,64,.25)",borderRadius:16,padding:"22px 18px",width:"100%",maxWidth:380,animation:"slideDown .22s ease",maxHeight:"90vh",overflowY:"auto"}}>{children}</div></div>);}
function Loader(){return(<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#050d1a",color:"#f0c040",fontSize:22,fontFamily:"sans-serif",gap:12}}><span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>⚽</span> Loading…</div>);}

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
.pts-ko{background:rgba(200,100,240,.15);color:#c87af0;border:1px solid rgba(200,100,240,.25);}
.pts-champ{background:rgba(240,192,64,.15);color:#f0c040;border:1px solid rgba(240,192,64,.25);}
.toast{position:fixed;bottom:52px;right:16px;background:linear-gradient(135deg,#1a2f1a,#162614);border:1px solid #50e080;color:#50e080;padding:11px 20px;border-radius:10px;z-index:999;font-weight:600;font-size:14px;animation:toastAnim 2.8s ease forwards;}
@keyframes toastAnim{0%{transform:translateX(120%);opacity:0}12%{transform:translateX(0);opacity:1}80%{transform:translateX(0);opacity:1}100%{transform:translateX(120%);opacity:0}}
@keyframes slideDown{from{transform:translateY(-18px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
.animate-in{animation:fadeIn .3s ease;}
`;

.animate-in{animation:fadeIn .3s ease;}
`;
