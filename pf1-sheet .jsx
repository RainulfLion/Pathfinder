import { useState, useMemo, useEffect, useRef } from "react";

const abilMod = s => Math.floor((s - 10) / 2);
const fmt = n => (n >= 0 ? `+${n}` : `${n}`);
const SIZES = { Fine:8,Diminutive:4,Tiny:2,Small:1,Medium:0,Large:-1,Huge:-2,Gargantuan:-4,Colossal:-8 };
const ABILITY = ["str","dex","con","int","wis","cha"];
const ABIL_LABEL = { str:"STR",dex:"DEX",con:"CON",int:"INT",wis:"WIS",cha:"CHA" };
const paAtk = bab => -(Math.floor(bab/4)+1);
const paDmg = (bab,th) => (Math.floor(bab/4)+1)*(th?3:2);
const daAtk = bab => -(Math.floor(bab/4)+1);
const daDmg = bab => (Math.floor(bab/4)+1)*2;

const ALL_SKILLS = [
  {id:"acrobatics",label:"Acrobatics",ab:"dex",to:false},
  {id:"appraise",label:"Appraise",ab:"int",to:false},
  {id:"bluff",label:"Bluff",ab:"cha",to:false},
  {id:"climb",label:"Climb",ab:"str",to:false},
  {id:"craft_alch",label:"Craft (Alchemy)",ab:"int",to:false},
  {id:"craft_arm",label:"Craft (Armor)",ab:"int",to:false},
  {id:"craft_bow",label:"Craft (Bows)",ab:"int",to:false},
  {id:"craft_trap",label:"Craft (Traps)",ab:"int",to:false},
  {id:"craft_wpn",label:"Craft (Weapons)",ab:"int",to:false},
  {id:"diplomacy",label:"Diplomacy",ab:"cha",to:false},
  {id:"disableDevice",label:"Disable Device",ab:"dex",to:true},
  {id:"disguise",label:"Disguise",ab:"cha",to:false},
  {id:"escapeArtist",label:"Escape Artist",ab:"dex",to:false},
  {id:"fly",label:"Fly",ab:"dex",to:false},
  {id:"handleAnimal",label:"Handle Animal",ab:"cha",to:true},
  {id:"heal",label:"Heal",ab:"wis",to:false},
  {id:"intimidate",label:"Intimidate",ab:"cha",to:false},
  {id:"kArcana",label:"Knowledge (Arcana)",ab:"int",to:true},
  {id:"kDungeoneering",label:"Knowledge (Dungeoneering)",ab:"int",to:true},
  {id:"kEngineering",label:"Knowledge (Engineering)",ab:"int",to:true},
  {id:"kGeography",label:"Knowledge (Geography)",ab:"int",to:true},
  {id:"kHistory",label:"Knowledge (History)",ab:"int",to:true},
  {id:"kLocal",label:"Knowledge (Local)",ab:"int",to:true},
  {id:"kNature",label:"Knowledge (Nature)",ab:"int",to:true},
  {id:"kNobility",label:"Knowledge (Nobility)",ab:"int",to:true},
  {id:"kPlanes",label:"Knowledge (Planes)",ab:"int",to:true},
  {id:"kReligion",label:"Knowledge (Religion)",ab:"int",to:true},
  {id:"linguistics",label:"Linguistics",ab:"int",to:true},
  {id:"perception",label:"Perception",ab:"wis",to:false},
  {id:"perform_act",label:"Perform (Act)",ab:"cha",to:false},
  {id:"perform_sing",label:"Perform (Sing)",ab:"cha",to:false},
  {id:"profession",label:"Profession",ab:"wis",to:true},
  {id:"ride",label:"Ride",ab:"dex",to:false},
  {id:"senseMotive",label:"Sense Motive",ab:"wis",to:false},
  {id:"sleightOfHand",label:"Sleight of Hand",ab:"dex",to:true},
  {id:"spellcraft",label:"Spellcraft",ab:"int",to:true},
  {id:"stealth",label:"Stealth",ab:"dex",to:false},
  {id:"survival",label:"Survival",ab:"wis",to:false},
  {id:"swim",label:"Swim",ab:"str",to:false},
  {id:"useMagicDevice",label:"Use Magic Device",ab:"cha",to:true},
];

const MECH_FEATS = [
  { id:"powerAttack", label:"Power Attack", cat:"Melee Offense", type:"powerAttack", badge:"⚔",
    prereq:"BAB +1, STR 13",
    rule:"On each melee attack take a penalty equal to −1 per 4 BAB (min −1). Gain +2 damage per −1 penalty, or +3 with a two-handed weapon, +1 with an off-hand weapon. Scales automatically as BAB increases." },
  { id:"cleave", label:"Cleave", cat:"Melee Offense", type:"info", badge:"🗡",
    prereq:"Power Attack, STR 13, BAB +1",
    rule:"After you drop a foe with a melee attack, immediately make one bonus melee attack against an adjacent enemy at the same attack bonus. You can only use Cleave once per round." },
  { id:"greatCleave", label:"Great Cleave", cat:"Melee Offense", type:"info", badge:"⚡",
    prereq:"Cleave, STR 13, BAB +4",
    rule:"Like Cleave, but there is no limit to how many bonus attacks you may make per round after drops. Attack, drop a foe, attack another, and keep going as long as foes fall." },
  { id:"weaponFocus", label:"Weapon Focus", cat:"Weapon Mastery", type:"atk", badge:"🎯", bonus:1,
    prereq:"Proficiency with weapon, BAB +1",
    rule:"+1 bonus to all attack rolls made with the chosen weapon type. Enter the weapon name below — it must match the weapon name in the Combat tab exactly to apply." },
  { id:"weaponSpec", label:"Weapon Specialization", cat:"Weapon Mastery", type:"dmg", badge:"💀", bonus:2,
    prereq:"Weapon Focus (same weapon), Fighter level 4",
    rule:"+2 bonus to all damage rolls made with the chosen weapon type. Requires Weapon Focus for the same weapon. Enter the weapon name to auto-apply." },
  { id:"greaterWeaponFocus", label:"Greater Weapon Focus", cat:"Weapon Mastery", type:"atk", badge:"🎯", bonus:1,
    prereq:"Weapon Focus (same), Fighter 8",
    rule:"An additional +1 attack bonus with the chosen weapon on top of Weapon Focus, for a total of +2." },
  { id:"greaterWeaponSpec", label:"Greater Weapon Specialization", cat:"Weapon Mastery", type:"dmg", badge:"💀", bonus:2,
    prereq:"Greater Weapon Focus, Weapon Spec, Fighter 12",
    rule:"An additional +2 damage bonus on top of Weapon Specialization, for a total of +4 damage." },
  { id:"pointBlankShot", label:"Point Blank Shot", cat:"Ranged", type:"ranged_pbs", badge:"🏹", bonus:1,
    prereq:"None",
    rule:"+1 bonus to both attack rolls and damage rolls with ranged weapons against targets within 30 feet." },
  { id:"deadlyAim", label:"Deadly Aim", cat:"Ranged", type:"ranged_pa", badge:"🏹",
    prereq:"DEX 13, BAB +1",
    rule:"Like Power Attack for ranged weapons. Take −1 attack per 4 BAB (min −1), gain +2 damage per penalty. Cannot be used on ranged touch attacks." },
  { id:"twoWeaponFighting", label:"Two-Weapon Fighting", cat:"Two-Weapon", type:"twf", badge:"⚔⚔",
    prereq:"DEX 15",
    rule:"Reduces TWF penalties: primary hand −2, off-hand −2 (when using a light off-hand weapon). Without this feat the penalties are −4/−8 (light) or −6/−10 (not light)." },
  { id:"improvedInit", label:"Improved Initiative", cat:"General", type:"init", badge:"⚡", bonus:4,
    prereq:"None",
    rule:"+4 bonus to all Initiative checks. Simple, stacks with Reactionary trait and DEX mod." },
  { id:"toughness", label:"Toughness", cat:"General", type:"hp", badge:"🛡",
    prereq:"None",
    rule:"+3 HP, plus +1 HP per Hit Die beyond 3. At level 10 you have +10 HP total from this feat." },
  { id:"ironWill", label:"Iron Will", cat:"Saves", type:"save", badge:"🧠", bonus:2, save:"will",
    prereq:"None",
    rule:"+2 bonus to all Will saving throws." },
  { id:"lightningReflexes", label:"Lightning Reflexes", cat:"Saves", type:"save", badge:"⚡", bonus:2, save:"ref",
    prereq:"None",
    rule:"+2 bonus to all Reflex saving throws." },
  { id:"greatFortitude", label:"Great Fortitude", cat:"Saves", type:"save", badge:"💪", bonus:2, save:"fort",
    prereq:"None",
    rule:"+2 bonus to all Fortitude saving throws." },
  { id:"combatExpertise", label:"Combat Expertise", cat:"Defense", type:"info", badge:"🛡",
    prereq:"INT 13",
    rule:"When making a melee attack you may declare up to a −5 penalty to attack rolls (limit = your BAB). You gain an equal dodge bonus to AC until the start of your next turn." },
  { id:"dodge", label:"Dodge", cat:"Defense", type:"info", badge:"🛡",
    prereq:"DEX 13",
    rule:"+1 dodge bonus to AC against one opponent you designate each round. Lost when flat-footed." },
  { id:"improvedGrapple", label:"Improved Grapple", cat:"Maneuvers", type:"info", badge:"✊",
    prereq:"Improved Unarmed Strike or natural attack, DEX 13",
    rule:"+2 CMB and CMD for grapple maneuvers. You do not provoke an AoO when you start a grapple." },
  { id:"improvedTrip", label:"Improved Trip", cat:"Maneuvers", type:"info", badge:"🦶",
    prereq:"INT 13, Combat Expertise",
    rule:"+2 CMB and CMD for trip maneuvers. No AoO when tripping. If you successfully trip, you may immediately make a free melee attack at your highest BAB." },
  { id:"improvedDisarm", label:"Improved Disarm", cat:"Maneuvers", type:"info", badge:"🤚",
    prereq:"INT 13, Combat Expertise",
    rule:"+2 CMB and CMD for disarm maneuvers. No AoO when disarming. Disarmed weapons land in your square." },
];

const FEAT_CATS = [...new Set(MECH_FEATS.map(f=>f.cat))];

const C = {
  bg:"#080503", panel:"#100b03", panelAlt:"#150f05",
  border:"#4a3010", gold:"#c9a84c", goldDim:"#7a5c28", goldBright:"#e8c86a",
  text:"#e0cc9a", textDim:"#907550", textMuted:"#604830",
  red:"#8b1a1a", redBright:"#c0392b",
  greenText:"#5dbe5d", blueText:"#6a9fdd", input:"#0a0703",
  featOn:"#0d1a05", featOnBorder:"#4a8a1a",
};
const fonts=`
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@700&family=EB+Garamond:ital,wght@0,400;0,600;1,400&display=swap');
  *{box-sizing:border-box;}body{background:${C.bg};margin:0;}
  input[type=number]::-webkit-inner-spin-button{opacity:.3;}
  ::-webkit-scrollbar{width:6px;height:6px;}::-webkit-scrollbar-track{background:#0a0703;}
  ::-webkit-scrollbar-thumb{background:#4a3010;border-radius:3px;}
`;
const Num=({val,set,w=52,min,max})=>(
  <input type="number" value={val} min={min} max={max} onChange={e=>set(Number(e.target.value))}
    style={{width:w,background:C.input,color:C.text,border:`1px solid ${C.border}`,
      borderRadius:3,textAlign:"center",padding:"2px 4px",fontFamily:"'EB Garamond',serif",fontSize:14}}/>
);
const Txt=({val,set,w=100,placeholder=""})=>(
  <input type="text" value={val} placeholder={placeholder} onChange={e=>set(e.target.value)}
    style={{width:w,background:C.input,color:C.text,border:`1px solid ${C.border}`,
      borderRadius:3,padding:"3px 6px",fontFamily:"'EB Garamond',serif",fontSize:14}}/>
);
const Area=({val,set,placeholder="",rows=2})=>(
  <textarea value={val} placeholder={placeholder} rows={rows} onChange={e=>set(e.target.value)}
    style={{width:"100%",background:C.input,color:C.text,border:`1px solid ${C.border}`,
      borderRadius:3,padding:"4px 6px",fontFamily:"'EB Garamond',serif",fontSize:14,
      resize:"vertical",minHeight:42}}/>
);
const Div=()=><div style={{height:1,background:`linear-gradient(90deg,transparent,${C.gold}44,transparent)`,margin:"10px 0"}}/>;
const Lbl=({children,style={}})=>(
  <div style={{fontFamily:"'Cinzel',serif",fontSize:10,letterSpacing:2,color:C.goldDim,
    textTransform:"uppercase",marginBottom:2,...style}}>{children}</div>
);
const Card=({children,style={}})=>(
  <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:6,padding:12,...style}}>
    {children}
  </div>
);
const H3=({children})=>(
  <div style={{fontFamily:"'Cinzel',serif",fontSize:13,color:C.gold,letterSpacing:1.5,
    marginBottom:10,paddingBottom:6,borderBottom:`1px solid ${C.border}`}}>⬡ {children}</div>
);
const RollBadge=({value,color,onClick,size=36})=>{
  const[h,sH]=useState(false);
  return(
    <span onClick={onClick} onMouseEnter={()=>sH(true)} onMouseLeave={()=>sH(false)} title="Click for breakdown"
      style={{display:"inline-flex",alignItems:"center",justifyContent:"center",
        minWidth:size,height:size,padding:"0 6px",
        background:h?"#1c1208":C.panel,border:`2px solid ${color??C.gold}`,
        borderRadius:5,color:color??C.gold,fontFamily:"'Cinzel',serif",fontWeight:700,
        fontSize:Math.round(size*.44),cursor:"pointer",userSelect:"none",
        boxShadow:h?`0 0 12px ${(color??C.gold)}55`:"none",transition:"all 0.15s"}}>
      {value===null?"—":fmt(value)}
    </span>
  );
};

const BreakdownPanel=({panel,onClose})=>{
  if(!panel)return null;
  const total=panel.rows.reduce((s,r)=>r.sep||r.value===null?s:s+(r.value??0),0);
  return(
    <div style={{position:"fixed",top:0,right:0,bottom:0,width:330,
      background:"#0e0904",borderLeft:`2px solid ${C.gold}`,
      boxShadow:"-4px 0 30px rgba(0,0,0,0.8)",zIndex:1000,overflowY:"auto",
      padding:20,fontFamily:"'EB Garamond',serif"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontFamily:"'Cinzel',serif",fontSize:15,color:C.gold}}>🎲 {panel.title}</div>
        <button onClick={onClose} style={{background:"none",border:`1px solid ${C.border}`,
          color:C.textDim,cursor:"pointer",borderRadius:3,padding:"2px 8px",fontSize:16}}>✕</button>
      </div>
      {panel.rule&&(
        <div style={{background:"#1a1208",border:`1px solid ${C.border}`,borderRadius:5,
          padding:10,fontSize:13,color:C.textDim,marginBottom:12,lineHeight:1.5}}>
          <span style={{color:C.gold}}>📖 </span>{panel.rule}
        </div>
      )}
      <Div/>
      {panel.rows.map((r,i)=>r.sep?<Div key={i}/>:(
        <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
          padding:r.highlight?"6px 8px":"5px 0",
          borderBottom:r.highlight?"none":`1px solid ${C.border}11`,
          background:r.highlight?"#1c1208":"none",borderRadius:r.highlight?4:0}}>
          <span style={{fontSize:13,color:r.highlight?C.text:C.textDim}}>{r.label}</span>
          <span style={{fontFamily:"'Cinzel',serif",fontSize:15,fontWeight:r.highlight?700:400,
            color:r.highlight?C.goldBright:(r.value>=0?C.gold:C.redBright)}}>
            {r.value===null?"—":fmt(r.value)}
          </span>
        </div>
      ))}
      <Div/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
        padding:"8px 10px",background:"#1c1208",borderRadius:6,border:`2px solid ${C.gold}`}}>
        <span style={{fontFamily:"'Cinzel',serif",fontSize:14,color:C.text}}>Roll: d20</span>
        <span style={{fontFamily:"'Cinzel',serif",fontSize:22,color:C.goldBright,fontWeight:700}}>{fmt(total)}</span>
      </div>
      <div style={{marginTop:12,fontSize:12,color:C.textMuted,textAlign:"center",lineHeight:1.4}}>
        Roll a d20 and add <span style={{color:C.gold}}>{fmt(total)}</span> to the result.
      </div>
    </div>
  );
};

// ── Feat Info Modal ──────────────────────────────────────────────────────────
const FeatInfoModal=({feat,onClose})=>{
  if(!feat)return null;
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:2000,
      display:"flex",alignItems:"center",justifyContent:"center"}}
      onClick={onClose}>
      <div style={{background:"#120d04",border:`2px solid ${C.gold}`,borderRadius:8,
        padding:24,maxWidth:440,width:"90%",fontFamily:"'EB Garamond',serif"}}
        onClick={e=>e.stopPropagation()}>
        <div style={{fontFamily:"'Cinzel',serif",fontSize:18,color:C.goldBright,marginBottom:6}}>
          {feat.badge} {feat.label}
        </div>
        <div style={{fontSize:12,color:C.textMuted,marginBottom:12,fontStyle:"italic"}}>
          Prerequisites: {feat.prereq}
        </div>
        <Div/>
        <div style={{fontSize:14,color:C.text,lineHeight:1.7,marginBottom:16}}>{feat.rule}</div>
        {feat.type==="powerAttack"&&(
          <div style={{background:"#0d0803",border:`1px solid ${C.border}`,borderRadius:5,padding:10}}>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:11,color:C.goldDim,marginBottom:6,letterSpacing:1}}>
              SCALING BY BAB
            </div>
            {[1,5,9,13,17].map(b=>(
              <div key={b} style={{display:"flex",justifyContent:"space-between",
                padding:"3px 0",borderBottom:`1px solid ${C.border}22`,fontSize:13,color:C.textDim}}>
                <span>BAB {b}–{b+3}</span>
                <span style={{color:C.gold}}>ATK {fmt(paAtk(b))} / DMG +{paDmg(b,false)} (+{paDmg(b,true)} 2H)</span>
              </div>
            ))}
          </div>
        )}
        <button onClick={onClose} style={{marginTop:16,background:"none",
          border:`1px solid ${C.gold}`,color:C.gold,borderRadius:4,
          padding:"6px 20px",cursor:"pointer",fontFamily:"'Cinzel',serif",fontSize:12}}>
          Close
        </button>
      </div>
    </div>
  );
};

export default function App(){
  const fileRef=useRef(null);

  useEffect(()=>{
    const s=document.createElement("style");s.textContent=fonts;document.head.appendChild(s);
    return()=>document.head.removeChild(s);
  },[]);

  const[info,setInfo]=useState({name:"Unnamed Hero",charClass:"Fighter",level:1,
    race:"Human",alignment:"LG",size:"Medium",deity:""});
  const[abil,setAbil]=useState({str:14,dex:12,con:13,int:10,wis:11,cha:8});
  const[racMod,setRacMod]=useState({str:0,dex:0,con:0,int:0,wis:0,cha:0});
  const[tmpMod,setTmpMod]=useState({str:0,dex:0,con:0,int:0,wis:0,cha:0});
  const[hp,setHp]=useState({max:12,cur:12,temp:0,nl:0});
  const[bab,setBab]=useState(1);
  const[acC,setAcC]=useState({armor:0,shield:0,nat:0,defl:0,dodge:0,misc:0});
  const[initMisc,setInitMisc]=useState(0);
  const[speed,setSpeed]=useState(30);
  const[saves,setSaves]=useState({fBase:2,rBase:0,wBase:0,fMisc:0,rMisc:0,wMisc:0});
  const[cmbMisc,setCmbMisc]=useState(0);
  const[cmdMisc,setCmdMisc]=useState(0);
  const[weapons,setWeapons]=useState([
    {id:1,name:"Longsword",type:"melee",dmg:"1d8",crit:"19-20/×2",
      atkM:0,dmgM:0,twoHanded:false,usePa:false,useDa:false}
  ]);
  const[skillData,setSkillData]=useState(()=>
    Object.fromEntries(ALL_SKILLS.map(s=>[s.id,{ranks:0,cs:false,misc:0}]))
  );
  const[featState,setFeatState]=useState(()=>
    Object.fromEntries(MECH_FEATS.map(f=>[f.id,{active:false,weaponName:""}]))
  );
  const[featNotes,setFeatNotes]=useState([{id:1,name:"",notes:""}]);
  const[classLevels,setClassLevels]=useState([
    {id:1,name:"Fighter",level:1,hitDie:"d10",bab:1,fort:2,ref:0,will:0,skillRanks:2,notes:""}
  ]);
  const[spells,setSpells]=useState([
    {id:1,name:"",level:0,school:"",castingTime:"",range:"",save:"",sr:"",prepared:false,used:false,notes:""}
  ]);
  const[dataMsg,setDataMsg]=useState("");
  const[panel,setPanel]=useState(null);
  const[tab,setTab]=useState("overview");
  const[infoFeat,setInfoFeat]=useState(null);
  const[featCat,setFeatCat]=useState(FEAT_CATS[0]);

  // ── Computed ───────────────────────────────────────────────────────────────
  const scores=useMemo(()=>Object.fromEntries(ABILITY.map(a=>[a,abil[a]+racMod[a]+tmpMod[a]])),[abil,racMod,tmpMod]);
  const mods=useMemo(()=>Object.fromEntries(ABILITY.map(a=>[a,abilMod(scores[a])])),[scores]);
  const sizeMod=SIZES[info.size]??0;
  const sizeAtkMod=-sizeMod;

  // Feat-derived bonuses
  const featInitBonus = featState.improvedInit?.active ? 4 : 0;
  const featFortBonus = featState.greatFortitude?.active ? 2 : 0;
  const featRefBonus  = featState.lightningReflexes?.active ? 2 : 0;
  const featWillBonus = featState.ironWill?.active ? 2 : 0;
  const pbsActive     = featState.pointBlankShot?.active;

  const acTotal=10+acC.armor+acC.shield+mods.dex+acC.nat+acC.defl+acC.dodge+acC.misc+sizeMod;
  const touchAC=10+mods.dex+acC.defl+acC.dodge+acC.misc+sizeMod;
  const ffAC=10+acC.armor+acC.shield+acC.nat+acC.defl+acC.misc+sizeMod;
  const init=mods.dex+initMisc+featInitBonus;
  const fort=saves.fBase+mods.con+saves.fMisc+featFortBonus;
  const ref=saves.rBase+mods.dex+saves.rMisc+featRefBonus;
  const will=saves.wBase+mods.wis+saves.wMisc+featWillBonus;
  const cmb=bab+mods.str+sizeAtkMod+cmbMisc;
  const cmd=10+bab+mods.str+mods.dex+sizeAtkMod+cmdMisc;

  const iteratives=atk=>{
    const a=[atk];
    if(bab>=6)a.push(atk-5);
    if(bab>=11)a.push(atk-10);
    if(bab>=16)a.push(atk-15);
    return a;
  };

  // Per-weapon feat bonuses
  const wFeatAtk=(w)=>{
    let bonus=0;
    // Weapon Focus
    if(featState.weaponFocus?.active &&
       w.name.toLowerCase()===featState.weaponFocus.weaponName.toLowerCase()) bonus+=1;
    // Greater Weapon Focus
    if(featState.greaterWeaponFocus?.active &&
       w.name.toLowerCase()===featState.greaterWeaponFocus.weaponName.toLowerCase()) bonus+=1;
    // Point Blank Shot (ranged)
    if(w.type==="ranged"&&pbsActive) bonus+=1;
    return bonus;
  };
  const wFeatDmg=(w)=>{
    let bonus=0;
    if(featState.weaponSpec?.active &&
       w.name.toLowerCase()===featState.weaponSpec.weaponName.toLowerCase()) bonus+=2;
    if(featState.greaterWeaponSpec?.active &&
       w.name.toLowerCase()===featState.greaterWeaponSpec.weaponName.toLowerCase()) bonus+=2;
    if(w.type==="ranged"&&pbsActive) bonus+=1;
    return bonus;
  };
  const wPaAtk=(w)=>{
    if(w.type==="melee"&&w.usePa&&featState.powerAttack?.active) return paAtk(bab);
    if(w.type==="ranged"&&w.useDa&&featState.deadlyAim?.active) return daAtk(bab);
    return 0;
  };
  const wPaDmg=(w)=>{
    if(w.type==="melee"&&w.usePa&&featState.powerAttack?.active) return paDmg(bab,w.twoHanded);
    if(w.type==="ranged"&&w.useDa&&featState.deadlyAim?.active) return daDmg(bab);
    return 0;
  };

  const wAtkTotal=(w)=>{
    const base=w.type==="melee"?mods.str:mods.dex;
    return bab+base+sizeAtkMod+w.atkM+wFeatAtk(w)+wPaAtk(w);
  };
  const wDmgBonus=(w)=>{
    const base=w.type==="melee"?mods.str:0;
    return base+w.dmgM+wFeatDmg(w)+wPaDmg(w);
  };

  const skillTotal=s=>{
    const d=skillData[s.id];
    if(s.to&&d.ranks===0)return null;
    return mods[s.ab]+d.ranks+(d.cs&&d.ranks>0?3:0)+d.misc;
  };
  const classTotals=useMemo(()=>classLevels.reduce((t,c)=>({
    level:t.level+(Number(c.level)||0),
    bab:t.bab+(Number(c.bab)||0),
    fort:t.fort+(Number(c.fort)||0),
    ref:t.ref+(Number(c.ref)||0),
    will:t.will+(Number(c.will)||0),
    skillRanks:t.skillRanks+(Number(c.skillRanks)||0),
  }),{level:0,bab:0,fort:0,ref:0,will:0,skillRanks:0}),[classLevels]);
  const classSummary=classLevels
    .filter(c=>c.name?.trim())
    .map(c=>`${c.name.trim()} ${c.level||0}`)
    .join(" / ");

  // ── Panel openers ──────────────────────────────────────────────────────────
  const openPanel=(title,rows,rule)=>setPanel({title,rows,rule});
  const openAbil=a=>openPanel(`${ABIL_LABEL[a]} Modifier`,[
    {label:`Base ${ABIL_LABEL[a]}`,value:abil[a]},
    {label:"Racial Modifier",value:racMod[a]},
    {label:"Temp Modifier",value:tmpMod[a]},
    {label:"Total Score",value:scores[a],sep:true},
    {label:`Modifier = (${scores[a]}−10)÷2`,value:mods[a],highlight:true},
  ],"Ability modifiers apply to most rolls that use this stat.");
  const openAC=()=>openPanel("Armor Class",[
    {label:"Base",value:10},{label:"Armor",value:acC.armor},{label:"Shield",value:acC.shield},
    {label:"DEX Mod",value:mods.dex},{label:"Natural",value:acC.nat},
    {label:"Deflection",value:acC.defl},{label:"Dodge",value:acC.dodge},
    {label:"Size",value:sizeMod},{label:"Misc",value:acC.misc},
    {label:"Total AC",value:acTotal,highlight:true,sep:true},
  ],"An attack roll must equal or exceed your AC to hit you.");
  const openTouch=()=>openPanel("Touch AC",[
    {label:"Base",value:10},{label:"DEX Mod",value:mods.dex},
    {label:"Deflection",value:acC.defl},{label:"Dodge",value:acC.dodge},
    {label:"Size",value:sizeMod},{label:"Misc",value:acC.misc},
    {label:"Touch AC",value:touchAC,highlight:true,sep:true},
  ],"Touch AC ignores armor, shield, and natural armor.");
  const openFF=()=>openPanel("Flat-Footed AC",[
    {label:"Base",value:10},{label:"Armor",value:acC.armor},{label:"Shield",value:acC.shield},
    {label:"Natural",value:acC.nat},{label:"Deflection",value:acC.defl},
    {label:"Size",value:sizeMod},{label:"Misc",value:acC.misc},
    {label:"Flat-Footed AC",value:ffAC,highlight:true,sep:true},
  ],"Used when you haven't acted or are denied DEX to AC.");
  const openInit=()=>openPanel("Initiative",[
    {label:"DEX Modifier",value:mods.dex},
    {label:"Misc",value:initMisc},
    ...(featInitBonus?[{label:"Improved Initiative",value:featInitBonus}]:[]),
    {label:"Initiative",value:init,highlight:true,sep:true},
  ],"Roll d20 + Initiative. Higher result acts earlier in combat.");
  const openAtk=(w)=>{
    const base=w.type==="melee"?mods.str:mods.dex;
    const abl=w.type==="melee"?"STR":"DEX";
    const total=wAtkTotal(w);
    const rows=[
      {label:"Base Attack Bonus",value:bab},
      {label:`${abl} Modifier`,value:base},
      {label:"Size Modifier",value:sizeAtkMod},
      {label:"Weapon Misc",value:w.atkM},
    ];
    if(wFeatAtk(w)) rows.push({label:"Feat Bonuses (WF/GWF/PBS)",value:wFeatAtk(w)});
    if(wPaAtk(w))   rows.push({label:w.type==="melee"?"Power Attack Penalty":"Deadly Aim Penalty",value:wPaAtk(w)});
    rows.push({label:"Primary Attack Total",value:total,highlight:true,sep:true});
    const its=iteratives(total);
    if(its.length>1){
      rows.push({label:"── Iterative Attacks ──",value:null});
      its.slice(1).forEach((v,i)=>rows.push({label:`Iterative Attack ${i+2}`,value:v}));
    }
    openPanel(`${w.name} — Attack Roll`,rows,
      `d20 + modifier vs target AC. Iterative attacks appear at BAB +6/+11/+16.`);
  };
  const openDmg=(w)=>{
    const abilBonus=w.type==="melee"?mods.str:0;
    const rows=[
      {label:`Roll: ${w.dmg}`,value:0},
      ...(w.type==="melee"?[{label:"STR Modifier",value:abilBonus}]:[]),
      {label:"Weapon Misc",value:w.dmgM},
    ];
    if(wFeatDmg(w)) rows.push({label:"Feat Bonuses (WS/GWS/PBS)",value:wFeatDmg(w)});
    if(wPaDmg(w))   rows.push({label:w.type==="melee"?"Power Attack Bonus":"Deadly Aim Bonus",value:wPaDmg(w)});
    rows.push({label:"Total Flat Bonus",value:wDmgBonus(w),highlight:true,sep:true});
    openPanel(`${w.name} — Damage`,rows,
      `Roll ${w.dmg} then add the flat bonus. Critical: ${w.crit}.`);
  };
  const openSave=(name,total,base,modName,modVal,misc,featB)=>openPanel(`${name} Save`,[
    {label:"Class Base",value:base},
    {label:`${modName} Modifier`,value:modVal},
    {label:"Misc",value:misc},
    ...(featB?[{label:"Feat Bonus",value:featB}]:[]),
    {label:`${name} Total`,value:total,highlight:true,sep:true},
  ],"Roll d20 + save bonus vs spell/effect DC. Fort=CON, Ref=DEX, Will=WIS.");
  const openCMB=()=>openPanel("CMB",[
    {label:"BAB",value:bab},{label:"STR Modifier",value:mods.str},
    {label:"Size Modifier",value:sizeAtkMod},{label:"Misc",value:cmbMisc},
    {label:"CMB",value:cmb,highlight:true,sep:true},
  ],"Roll d20+CMB vs target CMD to perform trip, grapple, disarm, bull rush, etc.");
  const openCMD=()=>openPanel("CMD",[
    {label:"Base",value:10},{label:"BAB",value:bab},
    {label:"STR Modifier",value:mods.str},{label:"DEX Modifier",value:mods.dex},
    {label:"Size Modifier",value:sizeAtkMod},{label:"Misc",value:cmdMisc},
    {label:"CMD",value:cmd,highlight:true,sep:true},
  ],"The DC others must beat with their CMB to perform a maneuver against you.");
  const openSkill=s=>{
    const d=skillData[s.id];const cs=d.cs&&d.ranks>0;
    openPanel(s.label,[
      {label:`${ABIL_LABEL[s.ab]} Modifier`,value:mods[s.ab]},
      {label:"Skill Ranks",value:d.ranks},
      {label:`Class Skill${cs?" ✓":" (need 1+ rank)"}`,value:cs?3:0},
      {label:"Misc",value:d.misc},
      {label:"Total",value:skillTotal(s)??null,highlight:true,sep:true},
    ],s.to?"Trained Only: requires at least 1 rank. Class skill +3 when trained.":"Class skill bonus +3 when you have 1+ rank.");
  };

  const updW=(id,k,v)=>setWeapons(ws=>ws.map(x=>x.id===id?{...x,[k]:v}:x));
  const addW=()=>setWeapons(ws=>[...ws,{id:Date.now(),name:"New Weapon",type:"melee",
    dmg:"1d6",crit:"20/×2",atkM:0,dmgM:0,twoHanded:false,usePa:false,useDa:false}]);
  const delW=id=>setWeapons(ws=>ws.filter(x=>x.id!==id));

  const toggleFeat=id=>setFeatState(p=>({...p,[id]:{...p[id],active:!p[id].active}}));
  const setFeatWpn=(id,v)=>setFeatState(p=>({...p,[id]:{...p[id],weaponName:v}}));

  const addFeatNote=()=>setFeatNotes(p=>[...p,{id:Date.now(),name:"",notes:""}]);
  const updFeatNote=(id,k,v)=>setFeatNotes(p=>p.map(x=>x.id===id?{...x,[k]:v}:x));
  const delFeatNote=id=>setFeatNotes(p=>p.filter(x=>x.id!==id));

  const addClass=()=>setClassLevels(p=>[...p,{id:Date.now(),name:"New Class",level:1,
    hitDie:"d8",bab:0,fort:0,ref:0,will:0,skillRanks:0,notes:""}]);
  const updClass=(id,k,v)=>setClassLevels(p=>p.map(x=>x.id===id?{...x,[k]:v}:x));
  const delClass=id=>setClassLevels(p=>p.filter(x=>x.id!==id));
  const applyClassTotals=()=>{
    setInfo(p=>({...p,level:classTotals.level||p.level,charClass:classSummary||p.charClass}));
    setBab(classTotals.bab);
    setSaves(p=>({...p,fBase:classTotals.fort,rBase:classTotals.ref,wBase:classTotals.will}));
    setDataMsg("Class totals applied to level, BAB, and saves.");
  };

  const addSpell=()=>setSpells(p=>[...p,{id:Date.now(),name:"New Spell",level:0,school:"",
    castingTime:"",range:"",save:"",sr:"",prepared:false,used:false,notes:""}]);
  const updSpell=(id,k,v)=>setSpells(p=>p.map(x=>x.id===id?{...x,[k]:v}:x));
  const delSpell=id=>setSpells(p=>p.filter(x=>x.id!==id));

  const characterData=()=>({
    schema:"pf1e-character-chronicle",
    version:1,
    savedAt:new Date().toISOString(),
    info,abil,racMod,tmpMod,hp,bab,acC,initMisc,speed,saves,cmbMisc,cmdMisc,
    weapons,skillData,featState,featNotes,classLevels,spells,
  });
  const applyCharacter=data=>{
    if(!data||typeof data!=="object")throw new Error("That JSON file does not look like a character.");
    if(data.info)setInfo(p=>({...p,...data.info}));
    if(data.abil)setAbil(p=>({...p,...data.abil}));
    if(data.racMod)setRacMod(p=>({...p,...data.racMod}));
    if(data.tmpMod)setTmpMod(p=>({...p,...data.tmpMod}));
    if(data.hp)setHp(p=>({...p,...data.hp}));
    if(data.bab!==undefined)setBab(Number(data.bab)||0);
    if(data.acC)setAcC(p=>({...p,...data.acC}));
    if(data.initMisc!==undefined)setInitMisc(Number(data.initMisc)||0);
    if(data.speed!==undefined)setSpeed(Number(data.speed)||0);
    if(data.saves)setSaves(p=>({...p,...data.saves}));
    if(data.cmbMisc!==undefined)setCmbMisc(Number(data.cmbMisc)||0);
    if(data.cmdMisc!==undefined)setCmdMisc(Number(data.cmdMisc)||0);
    if(Array.isArray(data.weapons))setWeapons(data.weapons);
    if(data.skillData)setSkillData(p=>({...p,...data.skillData}));
    if(data.featState)setFeatState(p=>({...p,...data.featState}));
    if(Array.isArray(data.featNotes))setFeatNotes(data.featNotes);
    if(Array.isArray(data.classLevels))setClassLevels(data.classLevels);
    if(Array.isArray(data.spells))setSpells(data.spells);
  };
  const saveJson=()=>{
    const blob=new Blob([JSON.stringify(characterData(),null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download=`${(info.name||"pathfinder-character").replace(/[^a-z0-9-_]+/gi,"_")}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setDataMsg("JSON file downloaded.");
  };
  const saveBrowser=()=>{
    localStorage.setItem("pf1e-character-chronicle",JSON.stringify(characterData()));
    setDataMsg("Character saved in this browser.");
  };
  const loadBrowser=()=>{
    const raw=localStorage.getItem("pf1e-character-chronicle");
    if(!raw){setDataMsg("No browser save found yet.");return;}
    try{applyCharacter(JSON.parse(raw));setDataMsg("Browser save loaded.");}
    catch(err){setDataMsg(err.message||"Could not load browser save.");}
  };
  const importJson=async e=>{
    const file=e.target.files?.[0];
    if(!file)return;
    try{
      applyCharacter(JSON.parse(await file.text()));
      setDataMsg(`Loaded ${file.name}.`);
    }catch(err){
      setDataMsg(err.message||"Could not import that JSON file.");
    }finally{
      e.target.value="";
    }
  };

  const TABS=["overview","combat","classes","skills","feats","spells"];
  const TLBL={overview:"Overview",combat:"Combat",classes:"Classes",skills:"Skills",feats:"Feats",spells:"Spells"};

  // Pill helper
  const Pill=({label,color,bg})=>(
    <span style={{background:bg,border:`1px solid ${color}`,borderRadius:10,
      padding:"1px 8px",fontSize:11,color,fontFamily:"'Cinzel',serif",
      whiteSpace:"nowrap"}}>{label}</span>
  );

  return(
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'EB Garamond',serif",
      color:C.text,paddingBottom:40}}>

      {/* Header */}
      <div style={{background:"linear-gradient(180deg,#1a0d02 0%,#0e0803 100%)",
        borderBottom:`2px solid ${C.gold}55`,padding:"16px 20px"}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:12}}>
            <div style={{fontFamily:"'Cinzel Decorative',serif",fontSize:22,
              color:C.gold,letterSpacing:3,textShadow:"0 0 20px rgba(201,168,76,.4)"}}>
              ⚔ Pathfinder 1e ⚔
            </div>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:11,color:C.goldDim,letterSpacing:4,marginTop:2}}>
              CHARACTER CHRONICLE
            </div>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:12,justifyContent:"center"}}>
            {[{l:"Character Name",v:info.name,s:v=>setInfo(p=>({...p,name:v})),w:160},
              {l:"Class",v:info.charClass,s:v=>setInfo(p=>({...p,charClass:v})),w:110},
              {l:"Race",v:info.race,s:v=>setInfo(p=>({...p,race:v})),w:100},
              {l:"Deity",v:info.deity,s:v=>setInfo(p=>({...p,deity:v})),w:100},
              {l:"Alignment",v:info.alignment,s:v=>setInfo(p=>({...p,alignment:v})),w:50},
            ].map(f=>(
              <div key={f.l} style={{textAlign:"center"}}>
                <Lbl style={{fontSize:9}}>{f.l}</Lbl>
                <Txt val={f.v} set={f.s} w={f.w}/>
              </div>
            ))}
            <div style={{textAlign:"center"}}><Lbl style={{fontSize:9}}>Level</Lbl>
              <Num val={info.level} set={v=>setInfo(p=>({...p,level:v}))} w={52} min={1} max={20}/></div>
            <div style={{textAlign:"center"}}><Lbl style={{fontSize:9}}>Size</Lbl>
              <select value={info.size} onChange={e=>setInfo(p=>({...p,size:e.target.value}))}
                style={{background:C.input,color:C.text,border:`1px solid ${C.border}`,
                  borderRadius:3,padding:"3px 6px",fontFamily:"'EB Garamond',serif",fontSize:14}}>
                {Object.keys(SIZES).map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:8,
            flexWrap:"wrap",marginTop:12}}>
            <button onClick={saveJson} style={{background:"#1a1208",border:`1px solid ${C.gold}`,
              color:C.gold,borderRadius:4,padding:"5px 12px",cursor:"pointer",
              fontFamily:"'Cinzel',serif",fontSize:11,letterSpacing:1}}>Export JSON</button>
            <button onClick={()=>fileRef.current?.click()} style={{background:"#1a1208",border:`1px solid ${C.goldDim}`,
              color:C.text,borderRadius:4,padding:"5px 12px",cursor:"pointer",
              fontFamily:"'Cinzel',serif",fontSize:11,letterSpacing:1}}>Import JSON</button>
            <button onClick={saveBrowser} style={{background:"#0d1a05",border:`1px solid ${C.featOnBorder}`,
              color:C.greenText,borderRadius:4,padding:"5px 12px",cursor:"pointer",
              fontFamily:"'Cinzel',serif",fontSize:11,letterSpacing:1}}>Save Browser</button>
            <button onClick={loadBrowser} style={{background:"#0d0804",border:`1px solid ${C.border}`,
              color:C.textDim,borderRadius:4,padding:"5px 12px",cursor:"pointer",
              fontFamily:"'Cinzel',serif",fontSize:11,letterSpacing:1}}>Load Browser</button>
            <input ref={fileRef} type="file" accept="application/json,.json" onChange={importJson}
              style={{display:"none"}}/>
            {dataMsg&&<span style={{fontSize:12,color:C.textDim,marginLeft:4}}>{dataMsg}</span>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",justifyContent:"center",gap:0,
        borderBottom:`1px solid ${C.border}`,background:"#0d0804"}}>
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            style={{padding:"10px 24px",background:"none",cursor:"pointer",border:"none",
              borderBottom:t===tab?`3px solid ${C.gold}`:"3px solid transparent",
              color:t===tab?C.gold:C.textDim,
              fontFamily:"'Cinzel',serif",fontSize:12,letterSpacing:2,transition:"all .15s"}}>
            {TLBL[t].toUpperCase()}
          </button>
        ))}
      </div>

      <div style={{maxWidth:1100,margin:"0 auto",padding:"16px 16px 0"}}>

        {/* ══ OVERVIEW ══ */}
        {tab==="overview"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <Card style={{gridColumn:"1/-1"}}>
              <H3>Ability Scores</H3>
              <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:8}}>
                {ABILITY.map(a=>{
                  const total=scores[a],m=mods[a];
                  return(
                    <div key={a} style={{background:"#150f05",border:`1px solid ${C.border}`,
                      borderRadius:6,padding:10,textAlign:"center"}}>
                      <Lbl>{ABIL_LABEL[a]}</Lbl>
                      {[{l:"Base",s:v=>setAbil(p=>({...p,[a]:v})),st:abil[a]},
                        {l:"Race",s:v=>setRacMod(p=>({...p,[a]:v})),st:racMod[a]},
                        {l:"Temp",s:v=>setTmpMod(p=>({...p,[a]:v})),st:tmpMod[a]}
                      ].map(f=>(
                        <div key={f.l} style={{display:"flex",gap:3,alignItems:"center",
                          justifyContent:"center",marginBottom:3}}>
                          <span style={{fontSize:10,color:C.textMuted,width:30,textAlign:"right"}}>{f.l}</span>
                          <Num val={f.st} set={f.s} w={44}/>
                        </div>
                      ))}
                      <div style={{fontFamily:"'Cinzel',serif",fontSize:26,color:C.text,
                        fontWeight:700,margin:"4px 0"}}>{total}</div>
                      <RollBadge value={m} color={m>=0?C.gold:C.redBright} onClick={()=>openAbil(a)}/>
                    </div>
                  );
                })}
              </div>
              <div style={{marginTop:8,fontSize:12,color:C.textMuted,textAlign:"center"}}>
                Click any modifier badge to see the full breakdown
              </div>
            </Card>

            <Card>
              <H3>Hit Points</H3>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12}}>
                {[{l:"Maximum",k:"max"},{l:"Current",k:"cur"},{l:"Temp HP",k:"temp"},{l:"Non-lethal",k:"nl"}
                ].map(f=>(
                  <div key={f.k} style={{textAlign:"center"}}>
                    <Lbl style={{fontSize:9}}>{f.l}</Lbl>
                    <div style={{color:f.k==="cur"?(hp.cur<hp.max*.25?C.redBright:hp.cur<hp.max*.5?"#d4943b":C.greenText):C.text}}>
                      <Num val={hp[f.k]} set={v=>setHp(p=>({...p,[f.k]:v}))} w={70}/>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{marginTop:10,background:"#0d0804",borderRadius:4,height:12,
                overflow:"hidden",border:`1px solid ${C.border}`}}>
                <div style={{height:"100%",
                  width:`${Math.max(0,Math.min(100,(hp.cur/hp.max)*100))}%`,
                  background:hp.cur<hp.max*.25
                    ?"linear-gradient(90deg,#6b1010,#c0392b)"
                    :hp.cur<hp.max*.5?"linear-gradient(90deg,#8b4d10,#d4943b)"
                    :"linear-gradient(90deg,#1a4a1a,#5dbe5d)",
                  transition:"width .3s,background .3s",borderRadius:4}}/>
              </div>
            </Card>

            <Card>
              <H3>Key Stats</H3>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div><Lbl style={{fontSize:9}}>Base Attack Bonus</Lbl>
                  <Num val={bab} set={setBab} w={60} min={0} max={20}/></div>
                <div><Lbl style={{fontSize:9}}>Speed (ft)</Lbl>
                  <Num val={speed} set={setSpeed} w={60}/></div>
                <div><Lbl style={{fontSize:9}}>Initiative Misc</Lbl>
                  <Num val={initMisc} set={setInitMisc} w={60}/></div>
                <div style={{textAlign:"center"}}>
                  <Lbl style={{fontSize:9}}>Initiative</Lbl>
                  <RollBadge value={init} onClick={openInit} size={38}/>
                  {featInitBonus>0&&<div style={{fontSize:10,color:C.greenText,marginTop:2}}>+{featInitBonus} Imp. Init</div>}
                </div>
              </div>
            </Card>

            <Card style={{gridColumn:"1/-1"}}>
              <H3>Armor Class</H3>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:12}}>
                {[{l:"Total AC",v:acTotal,col:C.blueText,fn:openAC},
                  {l:"Touch AC",v:touchAC,col:"#7ab8dd",fn:openTouch},
                  {l:"Flat-Footed",v:ffAC,col:"#8888cc",fn:openFF},
                  {l:"DEX Mod",v:mods.dex,col:C.gold,fn:()=>openAbil("dex")}
                ].map(x=>(
                  <div key={x.l} style={{textAlign:"center"}}>
                    <Lbl>{x.l}</Lbl>
                    <RollBadge value={x.v} color={x.col} onClick={x.fn} size={44}/>
                  </div>
                ))}
              </div>
              <Div/>
              <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:8}}>
                {[{l:"Armor",k:"armor"},{l:"Shield",k:"shield"},{l:"Natural",k:"nat"},
                  {l:"Deflection",k:"defl"},{l:"Dodge",k:"dodge"},{l:"Misc",k:"misc"}
                ].map(f=>(
                  <div key={f.k} style={{textAlign:"center"}}>
                    <Lbl style={{fontSize:9}}>{f.l}</Lbl>
                    <Num val={acC[f.k]} set={v=>setAcC(p=>({...p,[f.k]:v}))} w={52}/>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ══ COMBAT ══ */}
        {tab==="combat"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <Card style={{gridColumn:"1/-1"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <H3>Weapons & Attacks</H3>
                <button onClick={addW} style={{background:"none",border:`1px solid ${C.gold}`,
                  color:C.gold,borderRadius:4,padding:"3px 10px",cursor:"pointer",
                  fontFamily:"'Cinzel',serif",fontSize:11,letterSpacing:1}}>+ Add</button>
              </div>
              {weapons.map(w=>{
                const atkTotal=wAtkTotal(w);
                const dmgBonus=wDmgBonus(w);
                const its=iteratives(atkTotal);
                const paOn=w.type==="melee"&&w.usePa&&featState.powerAttack?.active;
                const daOn=w.type==="ranged"&&w.useDa&&featState.deadlyAim?.active;
                return(
                  <div key={w.id} style={{background:"#150f05",border:`1px solid ${C.border}`,
                    borderRadius:6,padding:12,marginBottom:8}}>
                    {/* Inputs */}
                    <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:10,alignItems:"flex-end"}}>
                      <div><Lbl style={{fontSize:9}}>Name</Lbl><Txt val={w.name} set={v=>updW(w.id,"name",v)} w={120}/></div>
                      <div><Lbl style={{fontSize:9}}>Type</Lbl>
                        <select value={w.type} onChange={e=>updW(w.id,"type",e.target.value)}
                          style={{background:C.input,color:C.text,border:`1px solid ${C.border}`,
                            borderRadius:3,padding:"3px 6px",fontFamily:"'EB Garamond',serif",fontSize:14}}>
                          <option value="melee">Melee</option>
                          <option value="ranged">Ranged</option>
                        </select>
                      </div>
                      <div><Lbl style={{fontSize:9}}>Damage</Lbl><Txt val={w.dmg} set={v=>updW(w.id,"dmg",v)} w={65} placeholder="1d8"/></div>
                      <div><Lbl style={{fontSize:9}}>Crit</Lbl><Txt val={w.crit} set={v=>updW(w.id,"crit",v)} w={85} placeholder="20/×2"/></div>
                      <div><Lbl style={{fontSize:9}}>Atk Misc</Lbl><Num val={w.atkM} set={v=>updW(w.id,"atkM",v)} w={50}/></div>
                      <div><Lbl style={{fontSize:9}}>Dmg Misc</Lbl><Num val={w.dmgM} set={v=>updW(w.id,"dmgM",v)} w={50}/></div>
                      {w.type==="melee"&&(
                        <label style={{display:"flex",alignItems:"center",gap:4,cursor:"pointer",
                          color:C.textDim,fontSize:12}}>
                          <input type="checkbox" checked={w.twoHanded}
                            onChange={e=>updW(w.id,"twoHanded",e.target.checked)}
                            style={{accentColor:C.gold,width:13,height:13}}/>
                          2H
                        </label>
                      )}
                      <button onClick={()=>delW(w.id)} style={{background:"none",border:`1px solid ${C.red}`,
                        color:C.redBright,borderRadius:3,padding:"3px 8px",cursor:"pointer",fontSize:12}}>✕</button>
                    </div>

                    {/* Feat toggle row */}
                    <div style={{display:"flex",gap:10,marginBottom:10,flexWrap:"wrap"}}>
                      {w.type==="melee"&&featState.powerAttack?.active&&(
                        <label style={{display:"flex",alignItems:"center",gap:5,cursor:"pointer",
                          background:paOn?"#1a2e0a":"#0d0804",
                          border:`1px solid ${paOn?C.featOnBorder:C.border}`,
                          borderRadius:4,padding:"4px 10px",transition:"all .15s"}}>
                          <input type="checkbox" checked={w.usePa}
                            onChange={e=>updW(w.id,"usePa",e.target.checked)}
                            style={{accentColor:C.gold}}/>
                          <span style={{fontFamily:"'Cinzel',serif",fontSize:11,
                            color:paOn?C.goldBright:C.textDim}}>Power Attack</span>
                          {paOn&&<span style={{fontSize:11,color:C.redBright}}>{fmt(paAtk(bab))}/{fmt(paDmg(bab,w.twoHanded))}</span>}
                        </label>
                      )}
                      {w.type==="ranged"&&featState.deadlyAim?.active&&(
                        <label style={{display:"flex",alignItems:"center",gap:5,cursor:"pointer",
                          background:daOn?"#1a2e0a":"#0d0804",
                          border:`1px solid ${daOn?C.featOnBorder:C.border}`,
                          borderRadius:4,padding:"4px 10px",transition:"all .15s"}}>
                          <input type="checkbox" checked={w.useDa}
                            onChange={e=>updW(w.id,"useDa",e.target.checked)}
                            style={{accentColor:C.gold}}/>
                          <span style={{fontFamily:"'Cinzel',serif",fontSize:11,
                            color:daOn?C.goldBright:C.textDim}}>Deadly Aim</span>
                          {daOn&&<span style={{fontSize:11,color:C.redBright}}>{fmt(daAtk(bab))}/{fmt(daDmg(bab))}</span>}
                        </label>
                      )}
                      {pbsActive&&w.type==="ranged"&&(
                        <span style={{background:"#1a1a2e",border:`1px solid #3a3a7a`,
                          borderRadius:4,padding:"4px 10px",
                          fontFamily:"'Cinzel',serif",fontSize:11,color:C.blueText}}>
                          PBS active (+1/+1 ≤30ft)
                        </span>
                      )}
                      {wFeatAtk(w)>0&&w.type==="melee"&&(
                        <span style={{background:"#1a2e0a",border:`1px solid ${C.featOnBorder}`,
                          borderRadius:4,padding:"4px 10px",
                          fontFamily:"'Cinzel',serif",fontSize:11,color:C.greenText}}>
                          WF/GWF {fmt(wFeatAtk(w))} ATK
                        </span>
                      )}
                      {wFeatDmg(w)>0&&w.type==="melee"&&(
                        <span style={{background:"#2e1a0a",border:`1px solid #7a3010`,
                          borderRadius:4,padding:"4px 10px",
                          fontFamily:"'Cinzel',serif",fontSize:11,color:"#dd7a50"}}>
                          WS/GWS +{wFeatDmg(w)} DMG
                        </span>
                      )}
                    </div>

                    {/* Results */}
                    <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
                      <div>
                        <Lbl style={{fontSize:9}}>Attack Roll(s)</Lbl>
                        <div style={{display:"flex",gap:6,alignItems:"center"}}>
                          {its.map((atk,i)=>(
                            <div key={i} style={{textAlign:"center"}}>
                              <RollBadge value={atk} onClick={()=>openAtk(w)} size={40}/>
                              {i>0&&<div style={{fontSize:9,color:C.textMuted}}>iter.{i+1}</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{color:C.textMuted,fontSize:18}}>→</div>
                      <div>
                        <Lbl style={{fontSize:9}}>Damage Bonus</Lbl>
                        <RollBadge value={dmgBonus} color={C.redBright} onClick={()=>openDmg(w)} size={40}/>
                        <div style={{fontSize:12,color:C.textDim,marginTop:2}}>{w.dmg} {fmt(dmgBonus)}</div>
                      </div>
                      <div style={{marginLeft:"auto",textAlign:"right"}}>
                        <Lbl style={{fontSize:9}}>Crit Range</Lbl>
                        <div style={{fontFamily:"'Cinzel',serif",color:C.goldDim,fontSize:13}}>{w.crit}</div>
                        <div style={{fontSize:11,color:C.textMuted}}>
                          {w.type==="melee"?"STR atk+dmg":"DEX atk, no ability to dmg"}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </Card>

            {/* Saves */}
            <Card>
              <H3>Saving Throws</H3>
              <div style={{display:"grid",gridTemplateColumns:"auto 1fr auto auto auto",gap:"8px 10px",alignItems:"center"}}>
                <div/><div/>
                <Lbl style={{fontSize:9,textAlign:"center"}}>Class</Lbl>
                <Lbl style={{fontSize:9,textAlign:"center"}}>Misc</Lbl>
                <Lbl style={{fontSize:9,textAlign:"center"}}>Total</Lbl>
                {[
                  {l:"FORT",col:"#b87c3a",total:fort,base:saves.fBase,baseK:"fBase",
                    mod:mods.con,modN:"CON",misc:saves.fMisc,miscK:"fMisc",fb:featFortBonus,sv:"Fortitude"},
                  {l:"REF",col:C.blueText,total:ref,base:saves.rBase,baseK:"rBase",
                    mod:mods.dex,modN:"DEX",misc:saves.rMisc,miscK:"rMisc",fb:featRefBonus,sv:"Reflex"},
                  {l:"WILL",col:C.greenText,total:will,base:saves.wBase,baseK:"wBase",
                    mod:mods.wis,modN:"WIS",misc:saves.wMisc,miscK:"wMisc",fb:featWillBonus,sv:"Will"},
                ].map(s=>(
                  <>
                    <div style={{fontFamily:"'Cinzel',serif",fontSize:12,color:C.gold}}>{s.l}</div>
                    <div style={{fontSize:12,color:C.textDim}}>
                      + {s.modN} {fmt(s.mod)}
                      {s.fb>0&&<span style={{color:C.greenText}}> +{s.fb}feat</span>}
                    </div>
                    <Num val={s.base} set={v=>setSaves(p=>({...p,[s.baseK]:v}))} w={50}/>
                    <Num val={s.misc} set={v=>setSaves(p=>({...p,[s.miscK]:v}))} w={50}/>
                    <RollBadge value={s.total} color={s.col} size={38}
                      onClick={()=>openSave(s.sv,s.total,s.base,s.modN,s.mod,s.misc,s.fb||0)}/>
                  </>
                ))}
              </div>
            </Card>

            {/* CMB/CMD */}
            <Card>
              <H3>Combat Maneuvers</H3>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                <div style={{textAlign:"center"}}>
                  <Lbl>CMB</Lbl>
                  <RollBadge value={cmb} onClick={openCMB} size={48}/>
                  <div style={{fontSize:11,color:C.textDim,marginTop:4}}>BAB+STR+Size</div>
                  <div style={{marginTop:6}}><Lbl style={{fontSize:9}}>Misc</Lbl>
                    <Num val={cmbMisc} set={setCmbMisc} w={60}/></div>
                </div>
                <div style={{textAlign:"center"}}>
                  <Lbl>CMD</Lbl>
                  <RollBadge value={cmd} color={C.blueText} onClick={openCMD} size={48}/>
                  <div style={{fontSize:11,color:C.textDim,marginTop:4}}>10+BAB+STR+DEX</div>
                  <div style={{marginTop:6}}><Lbl style={{fontSize:9}}>Misc</Lbl>
                    <Num val={cmdMisc} set={setCmdMisc} w={60}/></div>
                </div>
              </div>
              <Div/>
              <div style={{fontSize:12,color:C.textMuted,lineHeight:1.8}}>
                {["Trip","Grapple","Disarm","Bull Rush","Overrun","Sunder"].map(m=>(
                  <span key={m} style={{marginRight:12}}>
                    <span style={{color:C.goldDim}}>▸ {m}:</span> CMB vs CMD
                  </span>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ══ SKILLS ══ */}
        {tab==="classes"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr",gap:16}}>
            <Card>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <H3>Class Levels</H3>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={applyClassTotals} style={{background:"#1a1208",border:`1px solid ${C.gold}`,
                    color:C.gold,borderRadius:4,padding:"3px 10px",cursor:"pointer",
                    fontFamily:"'Cinzel',serif",fontSize:11,letterSpacing:1}}>Apply Totals</button>
                  <button onClick={addClass} style={{background:"none",border:`1px solid ${C.gold}`,
                    color:C.gold,borderRadius:4,padding:"3px 10px",cursor:"pointer",
                    fontFamily:"'Cinzel',serif",fontSize:11,letterSpacing:1}}>+ Add</button>
                </div>
              </div>
              <div style={{fontSize:12,color:C.textMuted,marginBottom:10}}>
                Track single-class or multiclass characters here. Apply Totals copies the summed level, BAB, and base saves into the sheet.
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1.2fr 70px 70px 70px 60px 60px 60px 80px 1.4fr 38px",
                gap:6,padding:"4px 6px",borderBottom:`1px solid ${C.border}`,
                fontFamily:"'Cinzel',serif",fontSize:10,color:C.goldDim,letterSpacing:1}}>
                <div>Class</div><div>Level</div><div>Hit Die</div><div>BAB</div>
                <div>Fort</div><div>Ref</div><div>Will</div><div>Skills</div><div>Notes</div><div/>
              </div>
              {classLevels.map(c=>(
                <div key={c.id} style={{display:"grid",
                  gridTemplateColumns:"1.2fr 70px 70px 70px 60px 60px 60px 80px 1.4fr 38px",
                  gap:6,padding:"7px 6px",alignItems:"start",borderBottom:`1px solid ${C.border}22`}}>
                  <Txt val={c.name} set={v=>updClass(c.id,"name",v)} w="100%" placeholder="Fighter"/>
                  <Num val={c.level} set={v=>updClass(c.id,"level",v)} w={60} min={0} max={20}/>
                  <Txt val={c.hitDie} set={v=>updClass(c.id,"hitDie",v)} w={62} placeholder="d10"/>
                  <Num val={c.bab} set={v=>updClass(c.id,"bab",v)} w={60} min={0}/>
                  <Num val={c.fort} set={v=>updClass(c.id,"fort",v)} w={52}/>
                  <Num val={c.ref} set={v=>updClass(c.id,"ref",v)} w={52}/>
                  <Num val={c.will} set={v=>updClass(c.id,"will",v)} w={52}/>
                  <Num val={c.skillRanks} set={v=>updClass(c.id,"skillRanks",v)} w={70} min={0}/>
                  <input type="text" value={c.notes} placeholder="Archetype, favored class, class features..."
                    onChange={e=>updClass(c.id,"notes",e.target.value)}
                    style={{width:"100%",background:C.input,color:C.text,
                      border:`1px solid ${C.border}`,borderRadius:3,
                      padding:"3px 6px",fontFamily:"'EB Garamond',serif",fontSize:14}}/>
                  <button onClick={()=>delClass(c.id)}
                    style={{background:"none",border:`1px solid ${C.red}`,color:C.redBright,
                      borderRadius:3,padding:"3px 8px",cursor:"pointer",fontSize:12}}>âœ•</button>
                </div>
              ))}
              <Div/>
              <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"center",justifyContent:"center"}}>
                <Pill label={`LEVEL ${classTotals.level}`} color={C.goldBright} bg="#1a1208"/>
                <Pill label={`BAB ${fmt(classTotals.bab)}`} color={C.greenText} bg="#1a2e0a"/>
                <Pill label={`FORT ${fmt(classTotals.fort)}`} color="#b87c3a" bg="#2e1a0a"/>
                <Pill label={`REF ${fmt(classTotals.ref)}`} color={C.blueText} bg="#1a1a2e"/>
                <Pill label={`WILL ${fmt(classTotals.will)}`} color={C.greenText} bg="#1a2e1a"/>
                <Pill label={`${classTotals.skillRanks} SKILL RANKS`} color={C.text} bg="#120d04"/>
              </div>
            </Card>
          </div>
        )}

        {tab==="skills"&&(
          <Card>
            <H3>Skills</H3>
            <div style={{fontSize:12,color:C.textMuted,marginBottom:10}}>
              ★ = Class Skill (+3 when trained) &nbsp;|&nbsp; 🔒 = Trained Only &nbsp;|&nbsp;
              Click the total badge for breakdown
            </div>
            <div style={{display:"grid",gridTemplateColumns:"200px 50px 60px 60px 60px 70px",
              gap:6,padding:"4px 6px",borderBottom:`1px solid ${C.border}`,
              fontFamily:"'Cinzel',serif",fontSize:10,color:C.goldDim,letterSpacing:1}}>
              <div>Skill</div><div style={{textAlign:"center"}}>Abil</div>
              <div style={{textAlign:"center"}}>Rnks</div><div style={{textAlign:"center"}}>Class</div>
              <div style={{textAlign:"center"}}>Misc</div><div style={{textAlign:"center"}}>Total</div>
            </div>
            <div style={{maxHeight:600,overflowY:"auto"}}>
              {ALL_SKILLS.map(s=>{
                const d=skillData[s.id],total=skillTotal(s),cs=d.cs&&d.ranks>0;
                const cantUse=s.to&&d.ranks===0;
                return(
                  <div key={s.id} style={{display:"grid",
                    gridTemplateColumns:"200px 50px 60px 60px 60px 70px",
                    gap:6,padding:"5px 6px",alignItems:"center",
                    borderBottom:`1px solid ${C.border}22`,
                    background:cantUse?"#0f0904":"none",opacity:cantUse?.6:1}}>
                    <div style={{fontSize:13,color:C.text,display:"flex",alignItems:"center",gap:4}}>
                      {d.cs&&<span style={{color:C.gold,fontSize:11}}>★</span>}
                      {s.to&&<span style={{fontSize:10}} title="Trained Only">🔒</span>}
                      {s.label}
                    </div>
                    <div style={{textAlign:"center",fontFamily:"'Cinzel',serif",fontSize:11,color:C.goldDim}}>
                      {ABIL_LABEL[s.ab]}
                      <div style={{fontSize:10,color:mods[s.ab]>=0?C.gold:C.redBright}}>{fmt(mods[s.ab])}</div>
                    </div>
                    <div style={{textAlign:"center"}}>
                      <Num val={d.ranks} w={50} min={0} max={20}
                        set={v=>setSkillData(p=>({...p,[s.id]:{...p[s.id],ranks:v}}))}/>
                    </div>
                    <div style={{display:"flex",justifyContent:"center"}}>
                      <input type="checkbox" checked={d.cs}
                        onChange={e=>setSkillData(p=>({...p,[s.id]:{...p[s.id],cs:e.target.checked}}))}
                        style={{accentColor:C.gold,width:14,height:14,cursor:"pointer"}}/>
                    </div>
                    <div style={{textAlign:"center"}}>
                      <Num val={d.misc} w={50}
                        set={v=>setSkillData(p=>({...p,[s.id]:{...p[s.id],misc:v}}))}/>
                    </div>
                    <div style={{display:"flex",justifyContent:"center"}}>
                      {cantUse
                        ?<span style={{fontFamily:"'Cinzel',serif",fontSize:13,color:C.textMuted}}>—</span>
                        :<RollBadge value={total??0} color={cs?C.goldBright:C.gold}
                          onClick={()=>openSkill(s)} size={34}/>}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* ══ FEATS ══ */}
        {tab==="feats"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>

            {/* Mechanical Feats */}
            <Card style={{gridColumn:"1/-1"}}>
              <H3>Mechanical Feats — Toggleable Bonuses</H3>
              <div style={{fontSize:12,color:C.textMuted,marginBottom:12}}>
                Check a feat to activate its bonus. Green chips show the live modifier being applied to your rolls.
                Click <strong style={{color:C.goldDim}}>?</strong> to read the full rule and scaling table.
              </div>

              {/* Category tabs */}
              <div style={{display:"flex",gap:0,marginBottom:14,flexWrap:"wrap"}}>
                {FEAT_CATS.map(cat=>(
                  <button key={cat} onClick={()=>setFeatCat(cat)}
                    style={{padding:"6px 14px",background:"none",cursor:"pointer",border:"none",
                      borderBottom:cat===featCat?`2px solid ${C.gold}`:`2px solid transparent`,
                      color:cat===featCat?C.gold:C.textDim,
                      fontFamily:"'Cinzel',serif",fontSize:11,letterSpacing:1,transition:"all .15s"}}>
                    {cat}
                  </button>
                ))}
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {MECH_FEATS.filter(f=>f.cat===featCat).map(f=>{
                  const fs=featState[f.id];
                  return(
                    <div key={f.id} style={{background:fs.active?C.featOn:C.panelAlt,
                      border:`1px solid ${fs.active?C.featOnBorder:C.border}`,
                      borderRadius:6,padding:10,transition:"all .2s"}}>
                      <div style={{display:"flex",alignItems:"flex-start",gap:8}}>
                        {/* Checkbox or badge */}
                        {f.type!=="info"?(
                          <div onClick={()=>toggleFeat(f.id)}
                            style={{cursor:"pointer",marginTop:3,width:18,height:18,flexShrink:0,
                              border:`2px solid ${fs.active?C.goldBright:C.border}`,
                              borderRadius:3,background:fs.active?C.gold:"transparent",
                              display:"flex",alignItems:"center",justifyContent:"center",
                              transition:"all .15s"}}>
                            {fs.active&&<span style={{fontSize:11,color:C.bg,fontWeight:700}}>✓</span>}
                          </div>
                        ):(
                          <div style={{width:18,height:18,flexShrink:0,display:"flex",
                            alignItems:"center",justifyContent:"center",fontSize:14}}>
                            {f.badge}
                          </div>
                        )}
                        <div style={{flex:1}}>
                          {/* Name row + live pills */}
                          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4,flexWrap:"wrap"}}>
                            <span style={{fontFamily:"'Cinzel',serif",fontSize:12,
                              color:fs.active?C.goldBright:C.gold}}>{f.label}</span>
                            {/* Live modifier chips */}
                            {fs.active&&f.type==="atk"&&
                              <Pill label={`ATK ${fmt(f.bonus)}`} color={C.greenText} bg="#1a2e0a"/>}
                            {fs.active&&f.type==="dmg"&&
                              <Pill label={`DMG +${f.bonus}`} color="#dd7a50" bg="#2e1a0a"/>}
                            {fs.active&&f.type==="powerAttack"&&<>
                              <Pill label={`ATK ${fmt(paAtk(bab))}`} color={C.redBright} bg="#2e0a0a"/>
                              <Pill label={`DMG +${paDmg(bab,false)}/+${paDmg(bab,true)}(2H)`} color="#dd7a50" bg="#2e1a0a"/>
                            </>}
                            {fs.active&&f.type==="ranged_pa"&&<>
                              <Pill label={`ATK ${fmt(daAtk(bab))}`} color={C.redBright} bg="#2e0a0a"/>
                              <Pill label={`DMG +${daDmg(bab)}`} color="#dd7a50" bg="#2e1a0a"/>
                            </>}
                            {fs.active&&f.type==="ranged_pbs"&&
                              <Pill label="ATK/DMG +1 (≤30ft)" color={C.blueText} bg="#1a1a2e"/>}
                            {fs.active&&f.type==="init"&&
                              <Pill label={`INIT ${fmt(f.bonus)}`} color={C.blueText} bg="#1a1a2e"/>}
                            {fs.active&&f.type==="save"&&
                              <Pill label={`${f.save.toUpperCase()} ${fmt(f.bonus)}`} color={C.greenText} bg="#1a2e1a"/>}
                            {fs.active&&f.type==="hp"&&
                              <Pill label={`+${3+Math.max(0,info.level-3)} HP`} color={C.greenText} bg="#1a2e1a"/>}
                            <button onClick={()=>setInfoFeat(f)}
                              style={{marginLeft:"auto",background:"none",border:`1px solid ${C.border}`,
                                color:C.textMuted,cursor:"pointer",borderRadius:3,
                                padding:"1px 6px",fontSize:11}}>?</button>
                          </div>
                          <div style={{fontSize:11,color:C.textMuted}}>{f.prereq}</div>
                          {/* Weapon name field for targeting feats */}
                          {fs.active&&(f.type==="atk"||f.type==="dmg")&&(
                            <div style={{marginTop:6,display:"flex",alignItems:"center",gap:6}}>
                              <span style={{fontSize:11,color:C.textDim}}>Weapon:</span>
                              <Txt val={fs.weaponName} set={v=>setFeatWpn(f.id,v)} w={130}
                                placeholder="Match weapon name exactly"/>
                            </div>
                          )}
                          {fs.active&&f.type==="info"&&(
                            <div style={{marginTop:6,fontSize:12,color:C.textDim,
                              background:"#0d0804",borderRadius:4,padding:"4px 8px",lineHeight:1.5}}>
                              📋 Situational — apply manually when triggered in combat.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Feat List */}
            <Card style={{gridColumn:"1/-1"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <H3>All Feats — Record</H3>
                <button onClick={addFeatNote} style={{background:"none",border:`1px solid ${C.gold}`,
                  color:C.gold,borderRadius:4,padding:"3px 10px",cursor:"pointer",
                  fontFamily:"'Cinzel',serif",fontSize:11,letterSpacing:1}}>+ Add</button>
              </div>
              <div style={{fontSize:12,color:C.textMuted,marginBottom:10}}>
                Record every feat your character has here, including those above plus any not listed.
              </div>
              {featNotes.map((fn,i)=>(
                <div key={fn.id} style={{display:"flex",gap:8,marginBottom:8,alignItems:"flex-start"}}>
                  <div style={{fontFamily:"'Cinzel',serif",fontSize:11,color:C.goldDim,
                    minWidth:20,paddingTop:5,textAlign:"right"}}>{i+1}.</div>
                  <div style={{flex:1,display:"flex",gap:8,flexWrap:"wrap"}}>
                    <div>
                      <Lbl style={{fontSize:9}}>Feat Name</Lbl>
                      <Txt val={fn.name} set={v=>updFeatNote(fn.id,"name",v)} w={180} placeholder="e.g. Cleave"/>
                    </div>
                    <div style={{flex:1,minWidth:200}}>
                      <Lbl style={{fontSize:9}}>Notes / Benefit</Lbl>
                      <input type="text" value={fn.notes} placeholder="Brief description or benefit..."
                        onChange={e=>updFeatNote(fn.id,"notes",e.target.value)}
                        style={{width:"100%",background:C.input,color:C.text,
                          border:`1px solid ${C.border}`,borderRadius:3,
                          padding:"3px 6px",fontFamily:"'EB Garamond',serif",fontSize:14}}/>
                    </div>
                  </div>
                  <button onClick={()=>delFeatNote(fn.id)}
                    style={{background:"none",border:`1px solid ${C.red}`,color:C.redBright,
                      borderRadius:3,padding:"3px 8px",cursor:"pointer",fontSize:12,marginTop:18}}>✕</button>
                </div>
              ))}
            </Card>
          </div>
        )}

        {tab==="spells"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr",gap:16}}>
            <Card>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <H3>Spellbook</H3>
                <button onClick={addSpell} style={{background:"none",border:`1px solid ${C.gold}`,
                  color:C.gold,borderRadius:4,padding:"3px 10px",cursor:"pointer",
                  fontFamily:"'Cinzel',serif",fontSize:11,letterSpacing:1}}>+ Add</button>
              </div>
              <div style={{fontSize:12,color:C.textMuted,marginBottom:10}}>
                Add prepared, known, wand, scroll, or innate spells. Every field is included when you export the character JSON.
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1.3fr 62px 1fr 1fr 1fr 1fr 70px 70px 70px 1.5fr 38px",
                gap:6,padding:"4px 6px",borderBottom:`1px solid ${C.border}`,
                fontFamily:"'Cinzel',serif",fontSize:10,color:C.goldDim,letterSpacing:1}}>
                <div>Name</div><div>Level</div><div>School</div><div>Cast</div><div>Range</div>
                <div>Save</div><div>SR</div><div>Prep</div><div>Used</div><div>Notes</div><div/>
              </div>
              {spells.map(sp=>(
                <div key={sp.id} style={{display:"grid",
                  gridTemplateColumns:"1.3fr 62px 1fr 1fr 1fr 1fr 70px 70px 70px 1.5fr 38px",
                  gap:6,padding:"7px 6px",alignItems:"start",borderBottom:`1px solid ${C.border}22`}}>
                  <Txt val={sp.name} set={v=>updSpell(sp.id,"name",v)} w="100%" placeholder="Magic Missile"/>
                  <Num val={sp.level} set={v=>updSpell(sp.id,"level",v)} w={54} min={0} max={9}/>
                  <Txt val={sp.school} set={v=>updSpell(sp.id,"school",v)} w="100%" placeholder="Evocation"/>
                  <Txt val={sp.castingTime} set={v=>updSpell(sp.id,"castingTime",v)} w="100%" placeholder="1 std"/>
                  <Txt val={sp.range} set={v=>updSpell(sp.id,"range",v)} w="100%" placeholder="Medium"/>
                  <Txt val={sp.save} set={v=>updSpell(sp.id,"save",v)} w="100%" placeholder="None"/>
                  <Txt val={sp.sr} set={v=>updSpell(sp.id,"sr",v)} w="100%" placeholder="Yes"/>
                  <label style={{display:"flex",justifyContent:"center",alignItems:"center",gap:4,
                    color:C.textDim,fontSize:12,paddingTop:5,cursor:"pointer"}}>
                    <input type="checkbox" checked={sp.prepared}
                      onChange={e=>updSpell(sp.id,"prepared",e.target.checked)}
                      style={{accentColor:C.gold,width:14,height:14}}/>
                    Prep
                  </label>
                  <label style={{display:"flex",justifyContent:"center",alignItems:"center",gap:4,
                    color:C.textDim,fontSize:12,paddingTop:5,cursor:"pointer"}}>
                    <input type="checkbox" checked={sp.used}
                      onChange={e=>updSpell(sp.id,"used",e.target.checked)}
                      style={{accentColor:C.gold,width:14,height:14}}/>
                    Used
                  </label>
                  <input type="text" value={sp.notes} placeholder="DC, components, duration, effect..."
                    onChange={e=>updSpell(sp.id,"notes",e.target.value)}
                    style={{width:"100%",background:C.input,color:C.text,
                      border:`1px solid ${C.border}`,borderRadius:3,
                      padding:"3px 6px",fontFamily:"'EB Garamond',serif",fontSize:14}}/>
                  <button onClick={()=>delSpell(sp.id)}
                    style={{background:"none",border:`1px solid ${C.red}`,color:C.redBright,
                      borderRadius:3,padding:"3px 8px",cursor:"pointer",fontSize:12}}>âœ•</button>
                </div>
              ))}
            </Card>
          </div>
        )}
      </div>

      <BreakdownPanel panel={panel} onClose={()=>setPanel(null)}/>
      <FeatInfoModal feat={infoFeat} onClose={()=>setInfoFeat(null)}/>
    </div>
  );
}
