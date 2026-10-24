(function(root){
  'use strict';
  const M={
    agency({b,c,r,sigma,v=1,u=0}){
      const e=b/c, risk=r*b*b*sigma*sigma/2, cost=c*e*e/2;
      const a=u-b*e+cost+risk, surplus=v*e-cost-risk;
      return {e,risk,cost,a,surplus,profit:surplus-u,bStar:v/(1+r*c*sigma*sigma),firstBest:v/c};
    },
    multi({b1,b2,rho,v1=1,v2=1,r=0,sigma1=0,sigma2=0}){
      // KKT for nonnegative effort and positive definite quadratic cost, |rho|<1.
      const d=1-rho*rho;
      const candidates=[[0,0],[Math.max(0,b1),0],[0,Math.max(0,b2)]];
      const x=(b1-rho*b2)/d,y=(b2-rho*b1)/d;
      if(x>=0&&y>=0)candidates.push([x,y]);
      const utility=([e1,e2])=>b1*e1+b2*e2-(e1*e1+e2*e2+2*rho*e1*e2)/2;
      const [e1,e2]=candidates.reduce((a,b)=>utility(a)>utility(b)?a:b);
      const cost=(e1*e1+e2*e2+2*rho*e1*e2)/2;
      const risk=r*(b1*b1*sigma1*sigma1+b2*b2*sigma2*sigma2)/2;
      return {e1,e2,cost,risk,value:v1*e1+v2*e2,surplus:v1*e1+v2*e2-cost-risk,corner:Math.min(e1,e2)<1e-8};
    },
    team({n,c=1,v=1}){
      const e=v/(n*c),fb=v/c;
      return {e,fb,total:n*e,fbTotal:n*fb,surplus:n*(v*e-c*e*e/2),fbSurplus:n*v*v/(2*c),ratio:1/n};
    },
    ownership({A,B,alpha,beta}){
      // R=A*i+B*j; outside options dB=alpha*A*i, dS=beta*B*j.
      const i=A*(1+alpha)/2,j=B*(1+beta)/2;
      const surplus=A*i+B*j-(i*i+j*j)/2;
      const db=alpha*A*i,ds=beta*B*j,R=A*i+B*j;
      return {i,j,surplus,R,db,ds,buyer:db+(R-db-ds)/2-i*i/2,seller:ds+(R-db-ds)/2-j*j/2,fb:(A*A+B*B)/2};
    },
    marginal(x,f,h=1e-5){return (f(x+h)-f(x-h))/(2*h);}
  };
  root.OrgModels=M;if(typeof module!=='undefined')module.exports=M;
})(typeof window!=='undefined'?window:globalThis);
