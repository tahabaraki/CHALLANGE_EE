const state={current:[],rounds:[],roundIndex:0,matchIndex:0,currentRoundMatches:[],champion:null};

const $=id=>document.getElementById(id);
const screens={access:$("accessScreen"),start:$("startScreen"),match:$("matchScreen"),winner:$("winnerScreen"),bracket:$("bracketScreen")};
const ACCESS_CODE="EE1402";

function show(screen){
  Object.values(screens).forEach(s=>s.classList.remove("active"));
  screen.classList.add("active");
  window.scrollTo({top:0,behavior:"instant"});
}
function shuffle(a){
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}
  return a;
}
function roundTitle(r,total){
  const rem=total-r;
  if(rem===1)return"FINAL";
  if(rem===2)return"SEMIFINAL";
  if(rem===3)return"QUARTERFINAL";
  return`ROUND ${r+1}`;
}
function totalRounds(n){return Math.max(1,Math.ceil(Math.log2(n)))}

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
  state.rounds=[];
  state.roundIndex=0;
  state.matchIndex=0;
  state.champion=null;
  buildRound();
  show(screens.match);
  renderMatch();
}

/*
  Important: no null/empty player is ever put into a selectable match.
  If a round has an odd number of players, exactly one player gets a BYE.
  The BYE is advanced automatically and is never shown as an empty choice.
*/
function buildRound(){
  const players=[...state.current];
  const matches=[];
  let byePlayer=null;

  if(players.length%2===1){
    const byeIndex=Math.floor(Math.random()*players.length);
    byePlayer=players.splice(byeIndex,1)[0];
  }

  for(let i=0;i<players.length;i+=2){
    matches.push({
      p1:players[i],
      p2:players[i+1],
      winner:null,
      loser:null,
      method:"user"
    });
  }

  if(byePlayer!==null){
    matches.unshift({
      p1:byePlayer,
      p2:null,
      winner:byePlayer,
      loser:null,
      method:"bye"
    });
  }

  state.currentRoundMatches=matches;
  state.matchIndex=0;
  state.rounds.push(matches);
  advanceBye();
}

function advanceBye(){
  while(
    state.matchIndex<state.currentRoundMatches.length &&
    state.currentRoundMatches[state.matchIndex].method==="bye"
  ){
    state.matchIndex++;
  }

  if(state.matchIndex>=state.currentRoundMatches.length) finishRound();
}

function renderMatch(){
  const m=state.currentRoundMatches[state.matchIndex];
  if(!m)return;

  const total=totalRounds(NAMES.length);
  const playable=state.currentRoundMatches.filter(x=>x.method==="user").length;
  const played=Math.min(state.matchIndex,state.currentRoundMatches.length);

  $("roundName").textContent=roundTitle(state.roundIndex,total);
  $("stageLabel").textContent=roundTitle(state.roundIndex,total);
  $("matchInfo").textContent=`MATCH ${String(state.matchIndex+1).padStart(2,"0")}`;
  $("nameA").textContent=m.p1;
  $("nameB").textContent=m.p2;
  $("progressBar").style.width=`${playable ? Math.min(100,(Math.max(0,played)/playable)*100) : 100}%`;

  $("cardA").disabled=false;
  $("cardB").disabled=false;
  $("cardB").style.visibility="visible";
  $("cardB").setAttribute("aria-hidden","false");
}

function choose(winner){
  const m=state.currentRoundMatches[state.matchIndex];
  if(!m || m.method!=="user")return;

  m.winner=winner;
  m.loser=winner===m.p1?m.p2:m.p1;
  state.matchIndex++;

  if(state.matchIndex>=state.currentRoundMatches.length) finishRound();
  else renderMatch();
}

function finishRound(){
  state.current=state.currentRoundMatches
    .map(m=>m.winner)
    .filter(x=>x!==null && x!==undefined);

  if(state.current.length===1){
    state.champion=state.current[0];
    showWinner();
    return;
  }

  state.roundIndex++;
  setTimeout(()=>{
    buildRound();
    renderMatch();
  },120);
}

function showWinner(){
  $("championName").textContent=state.champion;
  $("miniChampion").textContent=state.champion;
  show(screens.winner);
}

function renderBracket(){
  const b=$("bracket");
  b.innerHTML="";

  const total=state.rounds.length;
  state.rounds.forEach((matches,r)=>{
    const col=document.createElement("div");
    col.className="bracketRound";
    col.style.setProperty("--round-index",r);

    const title=document.createElement("div");
    title.className="roundTitle";
    title.textContent=roundTitle(r,total);
    col.appendChild(title);

    const list=document.createElement("div");
    list.className="roundMatches";

    matches.forEach((m)=>{
      const box=document.createElement("div");
      box.className="matchBox";

      const p1=document.createElement("div");
      p1.className="bracketPlayer";
      p1.textContent=m.p1 ?? "—";
      if(m.p1===m.winner)p1.classList.add("winner");
      if(m.p1===m.loser)p1.classList.add("loser");

      const p2=document.createElement("div");
      p2.className="bracketPlayer";
      if(m.p2===null){
        p2.textContent="استراحت";
        p2.classList.add("bye");
      }else{
        p2.textContent=m.p2;
        if(m.p2===m.winner)p2.classList.add("winner");
        if(m.p2===m.loser)p2.classList.add("loser");
      }

      box.append(p1,p2);
      list.appendChild(box);
    });

    col.appendChild(list);
    b.appendChild(col);
  });

  requestAnimationFrame(()=>{
    drawBracketConnections();
    centerBracket();
  });
}

function drawBracketConnections(){
  const b=$("bracket");
  if(!b)return;

  const old=b.querySelector(".bracketConnections");
  if(old)old.remove();

  const rounds=[...b.querySelectorAll(".bracketRound")];
  if(rounds.length<2)return;

  const br=b.getBoundingClientRect();
  const svgNS="http://www.w3.org/2000/svg";
  const svg=document.createElementNS(svgNS,"svg");
  svg.classList.add("bracketConnections");
  svg.setAttribute("width",b.scrollWidth);
  svg.setAttribute("height",b.scrollHeight);
  svg.setAttribute("viewBox",`0 0 ${b.scrollWidth} ${b.scrollHeight}`);

  state.rounds.forEach((matches,r)=>{
    if(r>=state.rounds.length-1)return;

    const currentBoxes=rounds[r].querySelectorAll(".matchBox");
    const nextBoxes=rounds[r+1].querySelectorAll(".matchBox");
    const nextMatches=state.rounds[r+1];

    matches.forEach((m,i)=>{
      if(!m.winner)return;

      const targetIndex=nextMatches.findIndex(n=>n.p1===m.winner || n.p2===m.winner);
      if(targetIndex<0 || !currentBoxes[i] || !nextBoxes[targetIndex])return;

      const a=currentBoxes[i].getBoundingClientRect();
      const c=nextBoxes[targetIndex].getBoundingClientRect();

      const x1=a.right-br.left+b.scrollLeft;
      const y1=a.top+a.height/2-br.top+b.scrollTop;
      const x2=c.left-br.left+b.scrollLeft;
      const y2=c.top+c.height/2-br.top+b.scrollTop;
      const mid=x1+(x2-x1)*.5;

      const path=document.createElementNS(svgNS,"path");
      path.setAttribute("d",`M ${x1} ${y1} H ${mid} V ${y2} H ${x2}`);
      svg.appendChild(path);
    });
  });

  b.appendChild(svg);
}

function centerBracket(){
  const b=$("bracket");
  if(!b)return;
  const overflow=b.scrollWidth>b.clientWidth;
  b.classList.toggle("isScrollable",overflow);
  if(!overflow)b.scrollLeft=0;
}

$("participantCount").textContent=NAMES.length;
$("startBtn").onclick=start;
$("cardA").onclick=()=>choose(state.currentRoundMatches[state.matchIndex]?.p1);
$("cardB").onclick=()=>choose(state.currentRoundMatches[state.matchIndex]?.p2);
$("bracketBtn").onclick=()=>{renderBracket();show(screens.bracket)};
$("restartBtn").onclick=start;
$("backBtn").onclick=()=>show(screens.winner);
window.addEventListener("resize",()=>{if(screens.bracket.classList.contains("active")){drawBracketConnections();centerBracket()}});
