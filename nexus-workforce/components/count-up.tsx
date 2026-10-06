'use client';
import {animate} from 'framer-motion';
import {useEffect,useRef,useState} from 'react';
export function CountUp({value,prefix='',decimals=0}:{value:number;prefix?:string;decimals?:number}){
  const [v,setV]=useState(0);const from=useRef(0);
  useEffect(()=>{const c=animate(from.current,value,{duration:0.9,ease:'easeOut',onUpdate:x=>setV(x)});from.current=value;return()=>c.stop()},[value]);
  return<>{prefix}{v.toLocaleString(undefined,{minimumFractionDigits:decimals,maximumFractionDigits:decimals})}</>;
}
