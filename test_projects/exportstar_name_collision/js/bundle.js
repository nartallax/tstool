[["/a",[],{"exports":["someval"]},"e=>{e.someval=5}"],["/a_force_then_b",["tslib","/a","/b"],"(e,r,t,a,o)=>{Object.defineProperty(e,'someval',{enumerable:!0,get:()=>a.someval}),t.__exportStar(o,e)}"],["/b",[],{"exports":["someval"]},"e=>{e.someval='nope'}"],["/b_force_then_a",["tslib","/b","/a"],"(e,r,t,a,o)=>{Object.defineProperty(e,'someval',{enumerable:!0,get:()=>a.someval}),t.__exportStar(o,e)}"],["/inst_a",["/rec_a_then_b"],{"exports":["InstA"]},"(s,n,t)=>{class InstA extends t.AbsA{}s.InstA=InstA}"],["/inst_b",["/rec_b_then_a"],{"exports":["InstB"]},"(s,n,t)=>{class InstB extends t.AbsB{}s.InstB=InstB}"],["/main",["/a_force_then_b","/rec_a_then_b","/b_force_then_a","/rec_b_then_a"],"(o,l,e,n,s,a)=>{o.main=function main(){console.log(e.someval),console.log(n.someval),console.log(s.someval),console.log(a.someval)}}"],["/rec_a_then_b",["tslib","/inst_a","/a","/b"],{"exportRefs":["/b"],"exports":["someval","AbsA"]},"function(e,t,o,s,n,r){Object.defineProperty(e,'someval',{enumerable:!0,get:()=>n.someval}),o.__exportStar(r,e),e.AbsA=class AbsA{constructor(){console.log(this instanceof s.InstA)}}}"],["/rec_b_then_a",["tslib","/inst_b","/b","/a"],{"exportRefs":["/a"],"exports":["someval","AbsB"]},"function(e,t,o,s,n,r){Object.defineProperty(e,'someval',{enumerable:!0,get:()=>n.someval}),o.__exportStar(r,e),e.AbsB=class AbsB{constructor(){console.log(this instanceof s.InstB)}}}"]]