const state={current:[],rounds:[],roundIndex:0,matchIndex:0,currentRoundMatches:[],champion:null};

const $=id=>document.getElementById(id);
const screens={access:$("accessScreen"),start:$("startScreen"),match:$("matchScreen"),winner:$("winnerScreen"),bracket:$("bracketScreen")};
const ACCESS_CODE="EE1402";

function show(screen){Object.values(screens).forEach(s=>s.classList.remove("active"));screen.classList.add("active");window.scrollTo(0,0)}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function power2(n){let p=1;while(p<n)p*=2;return p}
function roundTitle(r,total){const rem=total-r;if(rem===1)return"FINAL";if(rem===2)return"SEMIFINAL";if(rem===3)return"QUARTERFINAL";return`ROUND ${r+1}`}
function unlock(){
 const input=$("accessCode").value.trim();
 if(input===ACCESS_CODE){
   $("accessError").textContent="";
   show(screens.start);
   $("accessCode").value="";
 }else{
   $("accessError").textContent="کد ورود صحیح نیست.";
   $("accessCode").focus();
 }
}
$("accessBtn").onclick=unlock;
$("accessCode").addEventListener("keydown",e=>{if(e.key==="Enter")unlock()});

function start(){
 state.current=shuffle([...NAMES]);
 const size=power2(state.current.length);
 while(state.current.length<size)state.current.push(null);
 state.rounds=[];state.roundIndex=0;state.matchIndex=0;state.champion=null;
 buildRound();
 show(screens.match);
 renderMatch();
}
function buildRound(){
 const matches=[];
 for(let i=0;i<state.current.length;i+=2){
   const p1=state.current[i],p2=state.current[i+1];
   matches.push({p1,p2,winner:(p1===null?p2:(p2===null?p1:null)),loser:null,method:(p1===null||p2===null)?"bye":"user"});
 }
 state.currentRoundMatches=matches;
 state.matchIndex=0;
 state.rounds.push(matches);
 advanceBye();
}
function advanceBye(){
 while(state.matchIndex<state.currentRoundMatches.length && state.currentRoundMatches[state.matchIndex].method==="bye"){
   state.matchIndex++;
 }
 if(state.matchIndex>=state.currentRoundMatches.length)finishRound();
}
function renderMatch(){
 const m=state.currentRoundMatches[state.matchIndex];
 if(!m)return;
 const totalMatches=state.currentRoundMatches.length;
 $("roundName").textContent=roundTitle(state.roundIndex,state.rounds.length+Math.ceil(Math.log2(Math.max(1,totalMatches))));
 $("stageLabel").textContent=roundTitle(state.roundIndex,Math.ceil(Math.log2(power2(NAMES.length))));
 $("matchInfo").textContent=`MATCH ${String(state.matchIndex+1).padStart(2,"0")}`;
 $("nameA").textContent=m.p1;$("nameB").textContent=m.p2;
 $("progressBar").style.width=`${((state.matchIndex)/totalMatches)*100}%`;
}
function choose(winner){
 const m=state.currentRoundMatches[state.matchIndex];
 m.winner=winner;m.loser=winner===m.p1?m.p2:m.p1;
 state.matchIndex++;
 if(state.matchIndex>=state.currentRoundMatches.length)finishRound();else renderMatch();
}
function finishRound(){
 state.current=state.currentRoundMatches.map(m=>m.winner).filter(x=>x!==null);
 if(state.current.length===1){state.champion=state.current[0];showWinner();return}
 state.roundIndex++;
 setTimeout(()=>{buildRound();renderMatch()},120);
}
function showWinner(){
 $("championName").textContent=state.champion;
 $("miniChampion").textContent=state.champion;
 show(screens.winner);
}
function renderBracket(){
 const b=$("bracket");b.innerHTML="";
 state.rounds.forEach((matches,r)=>{
   const col=document.createElement("div");col.className="bracketRound";
   const title=document.createElement("div");title.className="roundTitle";title.textContent=roundTitle(r,state.rounds.length);col.appendChild(title);
   const list=document.createElement("div");list.className="roundMatches";
   matches.forEach(m=>{
     const box=document.createElement("div");box.className="matchBox";
     [m.p1,m.p2].forEach(p=>{
       const el=document.createElement("div");el.className="bracketPlayer";
       if(p===null){el.textContent="BYE";el.classList.add("bye")}
       else{el.textContent=p;if(p===m.winner)el.classList.add("winner");else if(p===m.loser)el.classList.add("loser")}
       box.appendChild(el);
     });
     list.appendChild(box);
   });
   col.appendChild(list);b.appendChild(col);
 });
}
$("participantCount").textContent=NAMES.length;
$("startBtn").onclick=start;
$("cardA").onclick=()=>choose(state.currentRoundMatches[state.matchIndex].p1);
$("cardB").onclick=()=>choose(state.currentRoundMatches[state.matchIndex].p2);
$("bracketBtn").onclick=()=>{renderBracket();show(screens.bracket)};
$("restartBtn").onclick=start;
$("backBtn").onclick=()=>show(screens.winner);
