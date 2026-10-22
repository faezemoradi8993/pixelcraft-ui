import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
const server = spawn('npm', ['run','dev','--','--host','127.0.0.1'], { stdio:'ignore', detached: true });
const sleep = ms => new Promise(r=>setTimeout(r,ms));
try {
  let ready=false;
  for(let i=0;i<35;i++){try{const r=await fetch('http://127.0.0.1:5173');if(r.ok){ready=true;break}}catch{}await sleep(400)}
  if(!ready)throw Error('Vite dev server did not start');
  await mkdir('screenshots',{recursive:true});
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',args:['--no-sandbox']});
  for(const [name,width,height] of [['desktop',1440,1100],['mobile',375,900]]){
    const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,reducedMotion:'reduce'});
    await page.goto('http://127.0.0.1:5173',{waitUntil:'networkidle'});
    await page.screenshot({path:`screenshots/${name}.png`,fullPage:true});
    console.log(name,await page.locator('article').count(),'cards');
    await page.close();
  }
  await browser.close();
} finally { try {process.kill(-server.pid,'SIGTERM')}catch{server.kill('SIGTERM')} }