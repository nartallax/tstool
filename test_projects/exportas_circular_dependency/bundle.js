[["/a",["/b","/b"],{"exports":["myval","A"]},"function(e,n,o,t){Object.defineProperty(e,'myval',{enumerable:!0,get:()=>t.someval}),e.A=class A{constructor(){console.log(this instanceof o.B)}}}"],["/b",["/a"],{"exports":["B","someval"]},"(e,s,a)=>{e.someval=747;class B extends a.A{}e.B=B}"],["/main",["/a"],"(n,o,a)=>{n.main=function main(){console.log(a.myval)}}"]]