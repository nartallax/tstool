[["/button",["/exporter"],{"exports":["Button"]},"(t,n,o)=>{class Button extends o.Control{}t.Button=Button}"],["/data",[],{"exports":["aval","bval","cval"]},"a=>{a.aval=5,a.bval=10,a.cval=20}"],["/exporter",["tslib","/button","/data"],{"exportRefs":["/data"],"exports":["Control"]},"function(o,t,n,r,c){n.__exportStar(c,o),o.Control=class Control{constructor(){this instanceof r.Button&&console.log('Hooray!')}}}"],["/main",["/exporter","/exporter"],"(n,o,l,a)=>{n.main=function main(){console.log(l.aval+l.bval+l.cval),console.log(Object.keys(a).sort().join('\\n'))}}"]]