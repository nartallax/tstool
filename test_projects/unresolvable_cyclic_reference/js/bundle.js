[["/button",["/control"],{"exports":["Button"]},"function(t,n,o){class Button extends o.Control{constructor(){super()}}t.Button=Button}"],["/control",["/button"],{"exports":["SubButton","Control"]},"function(t,n,o){let u=0;t.Control=class Control{constructor(){this.id=++u}};class SubButton extends o.Button{}t.SubButton=SubButton}"],["/main",["/control"],"(n,o,i)=>{n.main=function main(){console.log((new i.SubButton).id)}}"]]