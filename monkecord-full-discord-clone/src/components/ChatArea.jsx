import React,{useState,useEffect,useRef} from 'react';
import { db, storage } from '../firebase';
import { collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

export default function ChatArea({user,server,dm}){
const [messages,setMessages]=useState([]);
const [text,setText]=useState('');
const [file,setFile]=useState(null);
const bottomRef=useRef();
const roomId = dm ? [user.uid, dm.uid].sort().join('_') : server?.id;
useEffect(()=>{if(!roomId)return;const msgsRef=collection(db,'rooms',roomId,'messages');const q=query(msgsRef,orderBy('createdAt'));const unsub=onSnapshot(q,snap=>{const ms=[];snap.forEach(d=>ms.push({id:d.id,...d.data()}));setMessages(ms);}); return ()=>unsub();},[roomId]);
useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:'smooth'});},[messages]);
async function handleSend(e){e.preventDefault();if(!text&&!file)return;let fileUrl=null;if(file){const path=`uploads/${roomId}/${Date.now()}_${file.name}`;const storageRef=ref(storage,path);await uploadBytesResumable(storageRef,file);fileUrl=await getDownloadURL(storageRef);}const msgsRef=collection(db,'rooms',roomId,'messages');await addDoc(msgsRef,{senderId:user.uid,senderName:user.displayName||user.email.split('@')[0],text:text||'',fileUrl,createdAt:Date.now()});setText('');setFile(null);}
return (<div className="chat-area">
<div style={{flex:1,overflowY:'auto'}}>{messages.map(m=>(<div key={m.id} className={`chat-message ${m.senderId===user.uid?'self':''}`}>
<span>{m.senderName}: </span>{m.text} {m.fileUrl&&<a href={m.fileUrl} target="_blank">[file]</a>}
</div>))}<div ref={bottomRef}></div></div>
<form onSubmit={handleSend} style={{display:'flex',gap:'8px',marginTop:'8px'}}>
<input type="text" value={text} onChange={e=>setText(e.target.value)} placeholder="Message..." style={{flex:1,padding:'8px',borderRadius:'6px'}}/>
<input type="file" onChange={e=>setFile(e.target.files[0])}/>
<button type="submit">Send</button>
</form>
</div>);
}
