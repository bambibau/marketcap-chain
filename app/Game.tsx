"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Share2, PlayCircle, XCircle, CheckCircle2, ArrowUp, ArrowDown } from "lucide-react";

/*
Final build — Reveal-after + 200+ companies
------------------------------------------
• Press More/Less → THEN the number animates upward (slightly brisk, eases near the end).
• Result (correct/wrong) ONLY shown after the number fully reveals.
• Subtle feedback: green pulse on correct; red ring + shake on wrong.
• Chain mechanic: last shown stays as reference.
• LocalStorage handled on client only (SSR-safe) for highscore.
• Framer Motion: keyframe shakes use tween for x (spring only for scale) → fixes error.
• Logos via Clearbit <img> (no Next Image domain config needed).
• Tailwind colors: blue/grey/white palette.
*/

// ---------- Styles ----------
const CL = {
  page: "relative min-h-screen text-slate-100",
  bgFx:
    "pointer-events-none absolute inset-0 [background:radial-gradient(120%_80%_at_70%_-10%,rgba(37,99,235,.20),transparent),radial-gradient(100%_80%_at_10%_-10%,rgba(14,165,233,.10),transparent),linear-gradient(120deg,#0b1220,#0e162b,#0b1220)]",
  wrap: "relative max-w-6xl mx-auto px-5 py-6",
  btnPrimary:
    "inline-flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 transition-transform active:scale-[.98]",
  btnGhost:
    "inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-2 font-medium text-slate-100 focus-visible:ring-2 focus-visible:ring-blue-400 transition",
  hud: "flex items-center justify-between text-sm text-slate-300",
  grid: "mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch",
  card:
    "relative rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_6px_30px_-10px_rgba(0,0,0,.4)] p-6 flex flex-col items-center gap-3 select-none",
  logoBox:
    "w-28 h-28 rounded-full bg-slate-800/40 border border-white/10 flex items-center justify-center overflow-hidden",
  title: "text-lg font-semibold text-center",
  meta: "text-xs text-slate-300/90 text-center",
  cap: "text-3xl font-bold text-blue-300",
  unknown: "text-3xl font-bold text-slate-500/60",
};

// ---------- Types & utils ----------
export type Company = { name: string; ticker: string; domain: string; cap: number; country: string };
function pickDifferent(list: Company[], not: Company) { let x = not; while (x === not) x = list[Math.floor(Math.random()*list.length)]; return x; }
function formatCapB(bn: number) { return bn >= 1000 ? `$${(bn/1000).toFixed(1)}T` : `$${bn.toFixed(0)}B`; }
function logoUrl(domain: string) { return `https://logo.clearbit.com/${domain}`; }
function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3); }

// ---------- Dataset (≈220+ well-known companies; caps ~USD billions) ----------
const BASE: Company[] = [
  { name: "Apple", ticker: "AAPL", domain: "apple.com", cap: 3400, country: "US" },
  { name: "Microsoft", ticker: "MSFT", domain: "microsoft.com", cap: 3300, country: "US" },
  { name: "NVIDIA", ticker: "NVDA", domain: "nvidia.com", cap: 3000, country: "US" },
  { name: "Saudi Aramco", ticker: "2222.SR", domain: "aramco.com", cap: 2200, country: "SA" },
  { name: "Alphabet (Google)", ticker: "GOOGL", domain: "google.com", cap: 2200, country: "US" },
  { name: "Amazon", ticker: "AMZN", domain: "amazon.com", cap: 2100, country: "US" },
  { name: "Meta", ticker: "META", domain: "meta.com", cap: 1400, country: "US" },
  { name: "Berkshire Hathaway", ticker: "BRK.A", domain: "berkshirehathaway.com", cap: 1100, country: "US" },
  { name: "Eli Lilly", ticker: "LLY", domain: "lilly.com", cap: 1100, country: "US" },
  { name: "TSMC", ticker: "TSM", domain: "tsmc.com", cap: 1000, country: "TW" },
  { name: "Tesla", ticker: "TSLA", domain: "tesla.com", cap: 900, country: "US" },
  { name: "Broadcom", ticker: "AVGO", domain: "broadcom.com", cap: 700, country: "US" },
  { name: "Novo Nordisk", ticker: "NVO", domain: "novonordisk.com", cap: 650, country: "DK" },
  { name: "Visa", ticker: "V", domain: "visa.com", cap: 600, country: "US" },
  { name: "JPMorgan", ticker: "JPM", domain: "jpmorganchase.com", cap: 600, country: "US" },
  { name: "ExxonMobil", ticker: "XOM", domain: "exxon.com", cap: 500, country: "US" },
  { name: "ASML", ticker: "ASML", domain: "asml.com", cap: 500, country: "NL" },
  { name: "Walmart", ticker: "WMT", domain: "walmart.com", cap: 500, country: "US" },
  { name: "Mastercard", ticker: "MA", domain: "mastercard.com", cap: 400, country: "US" },
  { name: "LVMH", ticker: "MC.PA", domain: "lvmh.com", cap: 400, country: "FR" },
  { name: "Johnson & Johnson", ticker: "JNJ", domain: "jnj.com", cap: 400, country: "US" },
  { name: "Procter & Gamble", ticker: "PG", domain: "pg.com", cap: 380, country: "US" },
  { name: "Nestlé", ticker: "NESN.SW", domain: "nestle.com", cap: 350, country: "CH" },
  { name: "Costco", ticker: "COST", domain: "costco.com", cap: 350, country: "US" },
  { name: "Tencent", ticker: "0700.HK", domain: "tencent.com", cap: 350, country: "CN" },
  { name: "Home Depot", ticker: "HD", domain: "homedepot.com", cap: 350, country: "US" },
  { name: "Toyota", ticker: "7203.T", domain: "toyota-global.com", cap: 300, country: "JP" },
  { name: "Chevron", ticker: "CVX", domain: "chevron.com", cap: 300, country: "US" },
  { name: "AbbVie", ticker: "ABBV", domain: "abbvie.com", cap: 300, country: "US" },
  { name: "AMD", ticker: "AMD", domain: "amd.com", cap: 270, country: "US" },
  { name: "Roche", ticker: "ROG.SW", domain: "roche.com", cap: 250, country: "CH" },
  { name: "Novartis", ticker: "NOVN.SW", domain: "novartis.com", cap: 230, country: "CH" },
  { name: "Adobe", ticker: "ADBE", domain: "adobe.com", cap: 250, country: "US" },
  { name: "Netflix", ticker: "NFLX", domain: "netflix.com", cap: 250, country: "US" },
  { name: "Salesforce", ticker: "CRM", domain: "salesforce.com", cap: 240, country: "US" },
  { name: "SAP", ticker: "SAP", domain: "sap.com", cap: 230, country: "DE" },
  { name: "McDonald's", ticker: "MCD", domain: "mcdonalds.com", cap: 200, country: "US" },
  { name: "Coca‑Cola", ticker: "KO", domain: "coca-cola.com", cap: 300, country: "US" },
  { name: "PepsiCo", ticker: "PEP", domain: "pepsico.com", cap: 290, country: "US" },
  { name: "Intel", ticker: "INTC", domain: "intel.com", cap: 180, country: "US" },
  { name: "Nike", ticker: "NKE", domain: "nike.com", cap: 160, country: "US" },
  { name: "Pfizer", ticker: "PFE", domain: "pfizer.com", cap: 160, country: "US" },
  { name: "TotalEnergies", ticker: "TTE", domain: "totalenergies.com", cap: 160, country: "FR" },
  { name: "Siemens", ticker: "SIE.DE", domain: "siemens.com", cap: 140, country: "DE" },
  { name: "Airbus", ticker: "AIR.PA", domain: "airbus.com", cap: 130, country: "FR" },
  { name: "Boeing", ticker: "BA", domain: "boeing.com", cap: 120, country: "US" },
  { name: "BP", ticker: "BP.L", domain: "bp.com", cap: 110, country: "UK" },
  { name: "BYD", ticker: "1211.HK", domain: "byd.com", cap: 100, country: "CN" },
  { name: "IBM", ticker: "IBM", domain: "ibm.com", cap: 150, country: "US" },
  { name: "Volkswagen", ticker: "VOW3.DE", domain: "volkswagen.com", cap: 70, country: "DE" },
  { name: "Ferrari", ticker: "RACE", domain: "ferrari.com", cap: 80, country: "IT" },
  { name: "Xiaomi", ticker: "1810.HK", domain: "mi.com", cap: 55, country: "CN" },
  { name: "Spotify", ticker: "SPOT", domain: "spotify.com", cap: 60, country: "US" },
  { name: "Snowflake", ticker: "SNOW", domain: "snowflake.com", cap: 60, country: "US" },
  { name: "ServiceNow", ticker: "NOW", domain: "servicenow.com", cap: 160, country: "US" },
];

const EXTRA: Company[] = [
  // Tech & Semis
  { name: "Oracle", ticker: "ORCL", domain: "oracle.com", cap: 450, country: "US" },
  { name: "Cisco", ticker: "CSCO", domain: "cisco.com", cap: 230, country: "US" },
  { name: "Qualcomm", ticker: "QCOM", domain: "qualcomm.com", cap: 200, country: "US" },
  { name: "Texas Instruments", ticker: "TXN", domain: "ti.com", cap: 160, country: "US" },
  { name: "Applied Materials", ticker: "AMAT", domain: "appliedmaterials.com", cap: 180, country: "US" },
  { name: "Lam Research", ticker: "LRCX", domain: "lamresearch.com", cap: 120, country: "US" },
  { name: "KLA", ticker: "KLAC", domain: "kla.com", cap: 90, country: "US" },
  { name: "Micron", ticker: "MU", domain: "micron.com", cap: 140, country: "US" },
  { name: "Marvell", ticker: "MRVL", domain: "marvell.com", cap: 70, country: "US" },
  { name: "Arm", ticker: "ARM", domain: "arm.com", cap: 140, country: "UK" },
  { name: "Sony", ticker: "6758.T", domain: "sony.com", cap: 120, country: "JP" },
  { name: "Nintendo", ticker: "7974.T", domain: "nintendo.com", cap: 70, country: "JP" },
  { name: "HP Inc.", ticker: "HPQ", domain: "hp.com", cap: 35, country: "US" },
  { name: "Dell Technologies", ticker: "DELL", domain: "dell.com", cap: 90, country: "US" },
  { name: "Lenovo", ticker: "0992.HK", domain: "lenovo.com", cap: 15, country: "CN" },
  { name: "Acer", ticker: "2353.TW", domain: "acer.com", cap: 4, country: "TW" },
  { name: "ASUS", ticker: "2357.TW", domain: "asus.com", cap: 9, country: "TW" },
  { name: "Uber", ticker: "UBER", domain: "uber.com", cap: 160, country: "US" },
  { name: "Airbnb", ticker: "ABNB", domain: "airbnb.com", cap: 100, country: "US" },
  { name: "Booking Holdings", ticker: "BKNG", domain: "bookingholdings.com", cap: 130, country: "US" },
  { name: "Shopify", ticker: "SHOP", domain: "shopify.com", cap: 90, country: "CA" },
  { name: "MercadoLibre", ticker: "MELI", domain: "mercadolibre.com", cap: 90, country: "AR" },
  { name: "Sea Limited", ticker: "SE", domain: "sea.com", cap: 35, country: "SG" },
  { name: "Tencent Music", ticker: "TME", domain: "tencentmusic.com", cap: 10, country: "CN" },
  { name: "Palantir", ticker: "PLTR", domain: "palantir.com", cap: 60, country: "US" },
  { name: "Atlassian", ticker: "TEAM", domain: "atlassian.com", cap: 50, country: "AU" },
  { name: "MongoDB", ticker: "MDB", domain: "mongodb.com", cap: 40, country: "US" },
  { name: "Datadog", ticker: "DDOG", domain: "datadoghq.com", cap: 40, country: "US" },
  { name: "Cloudflare", ticker: "NET", domain: "cloudflare.com", cap: 35, country: "US" },
  { name: "Akamai", ticker: "AKAM", domain: "akamai.com", cap: 20, country: "US" },
  { name: "Zoom", ticker: "ZM", domain: "zoom.us", cap: 20, country: "US" },
  { name: "Samsung Electronics", ticker: "005930.KS", domain: "samsung.com", cap: 450, country: "KR" },

  // Internet & China
  { name: "Alibaba", ticker: "BABA", domain: "alibaba.com", cap: 190, country: "CN" },
  { name: "JD.com", ticker: "9618.HK", domain: "jd.com", cap: 50, country: "CN" },
  { name: "PDD Holdings", ticker: "PDD", domain: "pddholdings.com", cap: 190, country: "CN" },
  { name: "Baidu", ticker: "9888.HK", domain: "baidu.com", cap: 35, country: "CN" },
  { name: "Meituan", ticker: "3690.HK", domain: "meituan.com", cap: 90, country: "CN" },
  { name: "NetEase", ticker: "9999.HK", domain: "neteasegames.com", cap: 70, country: "CN" },
  { name: "Kuaishou", ticker: "1024.HK", domain: "kuaishou.com", cap: 30, country: "CN" },

  // Payments & Fintech
  { name: "PayPal", ticker: "PYPL", domain: "paypal.com", cap: 70, country: "US" },
  { name: "Block (Square)", ticker: "SQ", domain: "block.xyz", cap: 50, country: "US" },
  { name: "Adyen", ticker: "ADYEN.AS", domain: "adyen.com", cap: 45, country: "NL" },
  { name: "Fiserv", ticker: "FISV", domain: "fiserv.com", cap: 80, country: "US" },
  { name: "Fidelity National Info", ticker: "FIS", domain: "fisglobal.com", cap: 40, country: "US" },
  { name: "Global Payments", ticker: "GPN", domain: "globalpayments.com", cap: 35, country: "US" },
  { name: "Intuit", ticker: "INTU", domain: "intuit.com", cap: 160, country: "US" },
  { name: "Coinbase", ticker: "COIN", domain: "coinbase.com", cap: 50, country: "US" },

  // Banking & Asset Mgmt
  { name: "Bank of America", ticker: "BAC", domain: "bankofamerica.com", cap: 300, country: "US" },
  { name: "Wells Fargo", ticker: "WFC", domain: "wellsfargo.com", cap: 210, country: "US" },
  { name: "Citigroup", ticker: "C", domain: "citigroup.com", cap: 100, country: "US" },
  { name: "Goldman Sachs", ticker: "GS", domain: "goldmansachs.com", cap: 120, country: "US" },
  { name: "Morgan Stanley", ticker: "MS", domain: "morganstanley.com", cap: 140, country: "US" },
  { name: "American Express", ticker: "AXP", domain: "americanexpress.com", cap: 160, country: "US" },
  { name: "S&P Global", ticker: "SPGI", domain: "spglobal.com", cap: 120, country: "US" },
  { name: "Moody's", ticker: "MCO", domain: "moodys.com", cap: 70, country: "US" },
  { name: "BlackRock", ticker: "BLK", domain: "blackrock.com", cap: 130, country: "US" },
  { name: "Blackstone", ticker: "BX", domain: "blackstone.com", cap: 90, country: "US" },
  { name: "Charles Schwab", ticker: "SCHW", domain: "schwab.com", cap: 120, country: "US" },
  { name: "UBS", ticker: "UBSG.SW", domain: "ubs.com", cap: 110, country: "CH" },
  { name: "Deutsche Bank", ticker: "DBK.DE", domain: "db.com", cap: 25, country: "DE" },
  { name: "HSBC", ticker: "HSBA.L", domain: "hsbc.com", cap: 160, country: "UK" },
  { name: "Barclays", ticker: "BARC.L", domain: "barclays.com", cap: 35, country: "UK" },
  { name: "Lloyds Banking", ticker: "LLOY.L", domain: "lloydsbankinggroup.com", cap: 35, country: "UK" },
  { name: "Standard Chartered", ticker: "STAN.L", domain: "sc.com", cap: 25, country: "UK" },
  { name: "BNP Paribas", ticker: "BNP.PA", domain: "group.bnpparibas", cap: 90, country: "FR" },
  { name: "Société Générale", ticker: "GLE.PA", domain: "societegenerale.com", cap: 25, country: "FR" },
  { name: "Crédit Agricole", ticker: "ACA.PA", domain: "credit-agricole.com", cap: 40, country: "FR" },
  { name: "Banco Santander", ticker: "SAN", domain: "santander.com", cap: 70, country: "ES" },
  { name: "BBVA", ticker: "BBVA", domain: "bbva.com", cap: 60, country: "ES" },
  { name: "ING", ticker: "INGA.AS", domain: "ing.com", cap: 50, country: "NL" },
  { name: "AIA Group", ticker: "1299.HK", domain: "aia.com", cap: 90, country: "HK" },
  { name: "ICBC", ticker: "1398.HK", domain: "icbc-ltd.com", cap: 200, country: "CN" },
  { name: "China Construction Bank", ticker: "0939.HK", domain: "ccb.com", cap: 170, country: "CN" },
  { name: "Bank of China", ticker: "3988.HK", domain: "boc.cn", cap: 110, country: "CN" },
  { name: "Agricultural Bank of China", ticker: "1288.HK", domain: "abchina.com", cap: 120, country: "CN" },
  { name: "MUFG", ticker: "8306.T", domain: "mufg.jp", cap: 110, country: "JP" },
  { name: "SMFG", ticker: "8316.T", domain: "smfg.co.jp", cap: 100, country: "JP" },
  { name: "Mizuho", ticker: "8411.T", domain: "mizuho-fg.com", cap: 45, country: "JP" },
  { name: "HDFC Bank", ticker: "HDB", domain: "hdfcbank.com", cap: 160, country: "IN" },
  { name: "State Bank of India", ticker: "SBIN.NS", domain: "sbi.co.in", cap: 70, country: "IN" },

  // Insurance
  { name: "Allianz", ticker: "ALV.DE", domain: "allianz.com", cap: 100, country: "DE" },
  { name: "AXA", ticker: "CS.PA", domain: "axa.com", cap: 70, country: "FR" },
  { name: "AIG", ticker: "AIG", domain: "aig.com", cap: 50, country: "US" },
  { name: "MetLife", ticker: "MET", domain: "metlife.com", cap: 50, country: "US" },
  { name: "Prudential (US)", ticker: "PRU", domain: "prudential.com", cap: 40, country: "US" },
  { name: "Prudential (UK)", ticker: "PRU.L", domain: "prudentialplc.com", cap: 30, country: "UK" },
  { name: "Ping An", ticker: "2318.HK", domain: "pingan.com", cap: 130, country: "CN" },

  // Healthcare & Medtech
  { name: "Merck & Co.", ticker: "MRK", domain: "merck.com", cap: 350, country: "US" },
  { name: "Bristol Myers Squibb", ticker: "BMY", domain: "bms.com", cap: 90, country: "US" },
  { name: "Amgen", ticker: "AMGN", domain: "amgen.com", cap: 160, country: "US" },
  { name: "Gilead Sciences", ticker: "GILD", domain: "gilead.com", cap: 90, country: "US" },
  { name: "Regeneron", ticker: "REGN", domain: "regeneron.com", cap: 120, country: "US" },
  { name: "AstraZeneca", ticker: "AZN", domain: "astrazeneca.com", cap: 260, country: "UK" },
  { name: "Sanofi", ticker: "SAN.PA", domain: "sanofi.com", cap: 130, country: "FR" },
  { name: "GlaxoSmithKline", ticker: "GSK", domain: "gsk.com", cap: 90, country: "UK" },
  { name: "CSL Limited", ticker: "CSL.AX", domain: "csl.com", cap: 100, country: "AU" },
  { name: "Thermo Fisher", ticker: "TMO", domain: "thermofisher.com", cap: 220, country: "US" },
  { name: "Danaher", ticker: "DHR", domain: "danaher.com", cap: 180, country: "US" },
  { name: "Abbott", ticker: "ABT", domain: "abbott.com", cap: 190, country: "US" },
  { name: "Medtronic", ticker: "MDT", domain: "medtronic.com", cap: 120, country: "IE" },
  { name: "Stryker", ticker: "SYK", domain: "stryker.com", cap: 130, country: "US" },
  { name: "Siemens Healthineers", ticker: "SHL.DE", domain: "siemens-healthineers.com", cap: 70, country: "DE" },
  { name: "GE HealthCare", ticker: "GEHC", domain: "gehealthcare.com", cap: 50, country: "US" },
  { name: "Intuitive Surgical", ticker: "ISRG", domain: "intuitive.com", cap: 120, country: "US" },
  { name: "Dexcom", ticker: "DXCM", domain: "dexcom.com", cap: 40, country: "US" },
  { name: "Edwards Lifesciences", ticker: "EW", domain: "edwards.com", cap: 50, country: "US" },

  // Energy & Materials
  { name: "Shell", ticker: "SHEL", domain: "shell.com", cap: 230, country: "UK" },
  { name: "ConocoPhillips", ticker: "COP", domain: "conocophillips.com", cap: 130, country: "US" },
  { name: "Petrobras", ticker: "PBR", domain: "petrobras.com.br", cap: 110, country: "BR" },
  { name: "Equinor", ticker: "EQNR", domain: "equinor.com", cap: 80, country: "NO" },
  { name: "ENI", ticker: "ENI.MI", domain: "eni.com", cap: 55, country: "IT" },
  { name: "Repsol", ticker: "REP.MC", domain: "repsol.com", cap: 25, country: "ES" },
  { name: "Occidental Petroleum", ticker: "OXY", domain: "oxy.com", cap: 60, country: "US" },
  { name: "Schlumberger", ticker: "SLB", domain: "slb.com", cap: 70, country: "US" },
  { name: "Halliburton", ticker: "HAL", domain: "halliburton.com", cap: 35, country: "US" },
  { name: "Baker Hughes", ticker: "BKR", domain: "bakerhughes.com", cap: 35, country: "US" },
  { name: "CNOOC", ticker: "0883.HK", domain: "cnooc.com.cn", cap: 80, country: "CN" },
  { name: "PetroChina", ticker: "0857.HK", domain: "petrochina.com.cn", cap: 200, country: "CN" },
  { name: "Reliance Industries", ticker: "RELIANCE.NS", domain: "ril.com", cap: 220, country: "IN" },
  { name: "Adani Enterprises", ticker: "ADANIENT.NS", domain: "adani.com", cap: 50, country: "IN" },
  { name: "BHP", ticker: "BHP", domain: "bhp.com", cap: 160, country: "AU" },
  { name: "Rio Tinto", ticker: "RIO", domain: "riotinto.com", cap: 120, country: "UK" },
  { name: "Vale", ticker: "VALE", domain: "vale.com", cap: 70, country: "BR" },
  { name: "Glencore", ticker: "GLEN.L", domain: "glencore.com", cap: 70, country: "CH" },
  { name: "Anglo American", ticker: "AAL.L", domain: "angloamerican.com", cap: 40, country: "UK" },
  { name: "Freeport‑McMoRan", ticker: "FCX", domain: "fcx.com", cap: 70, country: "US" },
  { name: "Newmont", ticker: "NEM", domain: "newmont.com", cap: 35, country: "US" },
  { name: "Barrick Gold", ticker: "GOLD", domain: "barrick.com", cap: 30, country: "CA" },
  { name: "ArcelorMittal", ticker: "MT", domain: "corporate.arcelormittal.com", cap: 25, country: "LU" },
  { name: "Nucor", ticker: "NUE", domain: "nucor.com", cap: 40, country: "US" },

  // Utilities & Renewables
  { name: "NextEra Energy", ticker: "NEE", domain: "nexteraenergy.com", cap: 120, country: "US" },
  { name: "Duke Energy", ticker: "DUK", domain: "duke-energy.com", cap: 75, country: "US" },
  { name: "Southern Company", ticker: "SO", domain: "southerncompany.com", cap: 70, country: "US" },
  { name: "Dominion Energy", ticker: "D", domain: "dominionenergy.com", cap: 45, country: "US" },
  { name: "Iberdrola", ticker: "IBE.MC", domain: "iberdrola.com", cap: 80, country: "ES" },
  { name: "Enel", ticker: "ENEL.MI", domain: "enel.com", cap: 70, country: "IT" },
  { name: "EDF", ticker: "EDF.PA", domain: "edf.fr", cap: 50, country: "FR" },
  { name: "Engie", ticker: "ENGI.PA", domain: "engie.com", cap: 40, country: "FR" },
  { name: "National Grid", ticker: "NG.L", domain: "nationalgrid.com", cap: 50, country: "UK" },

  // Telecom & Media
  { name: "AT&T", ticker: "T", domain: "att.com", cap: 130, country: "US" },
  { name: "Verizon", ticker: "VZ", domain: "verizon.com", cap: 170, country: "US" },
  { name: "T‑Mobile US", ticker: "TMUS", domain: "t-mobile.com", cap: 190, country: "US" },
  { name: "Comcast", ticker: "CMCSA", domain: "comcast.com", cap: 180, country: "US" },
  { name: "Charter", ticker: "CHTR", domain: "spectrum.com", cap: 110, country: "US" },
  { name: "Disney", ticker: "DIS", domain: "thewaltdisneycompany.com", cap: 200, country: "US" },
  { name: "Warner Bros. Discovery", ticker: "WBD", domain: "wbd.com", cap: 25, country: "US" },
  { name: "Paramount Global", ticker: "PARA", domain: "paramount.com", cap: 10, country: "US" },
  { name: "Universal Music Group", ticker: "UMG.AS", domain: "umg.com", cap: 50, country: "NL" },
  { name: "BT Group", ticker: "BT.A", domain: "bt.com", cap: 15, country: "UK" },
  { name: "Vodafone", ticker: "VOD.L", domain: "vodafone.com", cap: 25, country: "UK" },
  { name: "Orange", ticker: "ORA.PA", domain: "orange.com", cap: 30, country: "FR" },
  { name: "Telefónica", ticker: "TEF", domain: "telefonica.com", cap: 25, country: "ES" },
  { name: "Deutsche Telekom", ticker: "DTE.DE", domain: "telekom.com", cap: 120, country: "DE" },
  { name: "NTT", ticker: "9432.T", domain: "ntt.com", cap: 90, country: "JP" },
  { name: "KDDI", ticker: "9433.T", domain: "kddi.com", cap: 60, country: "JP" },
  { name: "China Mobile", ticker: "0941.HK", domain: "chinamobileltd.com", cap: 130, country: "CN" },

  // Consumer & Retail
  { name: "Target", ticker: "TGT", domain: "target.com", cap: 65, country: "US" },
  { name: "Lowe's", ticker: "LOW", domain: "lowes.com", cap: 120, country: "US" },
  { name: "Inditex (Zara)", ticker: "ITX.MC", domain: "inditex.com", cap: 140, country: "ES" },
  { name: "H&M", ticker: "HM‑B.ST", domain: "hm.com", cap: 25, country: "SE" },
  { name: "Fast Retailing (Uniqlo)", ticker: "9983.T", domain: "fastretailing.com", cap: 80, country: "JP" },
  { name: "Adidas", ticker: "ADS.DE", domain: "adidas.com", cap: 40, country: "DE" },
  { name: "Hermès", ticker: "RMS.PA", domain: "hermes.com", cap: 250, country: "FR" },
  { name: "Kering", ticker: "KER.PA", domain: "kering.com", cap: 60, country: "FR" },
  { name: "Richemont", ticker: "CFR.SW", domain: "richemont.com", cap: 90, country: "CH" },
  { name: "Moncler", ticker: "MONC.MI", domain: "moncler.com", cap: 20, country: "IT" },
  { name: "Prada", ticker: "1913.HK", domain: "prada.com", cap: 20, country: "IT" },
  { name: "Burberry", ticker: "BRBY.L", domain: "burberry.com", cap: 8, country: "UK" },
  { name: "Starbucks", ticker: "SBUX", domain: "starbucks.com", cap: 100, country: "US" },
  { name: "Yum! Brands", ticker: "YUM", domain: "yum.com", cap: 35, country: "US" },
  { name: "Chipotle", ticker: "CMG", domain: "chipotle.com", cap: 80, country: "US" },
  { name: "Lululemon", ticker: "LULU", domain: "lululemon.com", cap: 45, country: "CA" },
  { name: "IKEA (Ingka)", ticker: "IKEA‑P", domain: "ikea.com", cap: 60, country: "SE" },

  { name: "Unilever", ticker: "ULVR.L", domain: "unilever.com", cap: 120, country: "UK" },
  { name: "Colgate‑Palmolive", ticker: "CL", domain: "colgatepalmolive.com", cap: 70, country: "US" },
  { name: "Mondelez", ticker: "MDLZ", domain: "mondelezinternational.com", cap: 100, country: "US" },
  { name: "Danone", ticker: "BN.PA", domain: "danone.com", cap: 40, country: "FR" },
  { name: "Heineken", ticker: "HEIA.AS", domain: "theheinekencompany.com", cap: 55, country: "NL" },
  { name: "AB InBev", ticker: "ABI.BR", domain: "ab-inbev.com", cap: 110, country: "BE" },
  { name: "Diageo", ticker: "DGE.L", domain: "diageo.com", cap: 90, country: "UK" },
  { name: "L'Oréal", ticker: "OR.PA", domain: "loreal.com", cap: 240, country: "FR" },
  { name: "Estée Lauder", ticker: "EL", domain: "elcompanies.com", cap: 60, country: "US" },
  { name: "Reckitt", ticker: "RKT.L", domain: "reckitt.com", cap: 45, country: "UK" },
  { name: "Kimberly‑Clark", ticker: "KMB", domain: "kimberly-clark.com", cap: 45, country: "US" },

  // Autos & Mobility
  { name: "Mercedes‑Benz Group", ticker: "MBG.DE", domain: "group.mercedes-benz.com", cap: 75, country: "DE" },
  { name: "BMW", ticker: "BMW.DE", domain: "bmwgroup.com", cap: 70, country: "DE" },
  { name: "Stellantis", ticker: "STLAM.MI", domain: "stellantis.com", cap: 70, country: "NL" },
  { name: "Ford", ticker: "F", domain: "ford.com", cap: 60, country: "US" },
  { name: "General Motors", ticker: "GM", domain: "gm.com", cap: 55, country: "US" },
  { name: "Honda", ticker: "7267.T", domain: "global.honda", cap: 60, country: "JP" },
  { name: "Hyundai", ticker: "005380.KS", domain: "hyundai.com", cap: 45, country: "KR" },
  { name: "Kia", ticker: "000270.KS", domain: "kia.com", cap: 40, country: "KR" },
  { name: "Volvo Cars", ticker: "VOLCAR‑B.ST", domain: "volvocars.com", cap: 20, country: "SE" },
  { name: "Rivian", ticker: "RIVN", domain: "rivian.com", cap: 25, country: "US" },
  { name: "NIO", ticker: "9866.HK", domain: "nio.com", cap: 18, country: "CN" },
  { name: "XPeng", ticker: "9868.HK", domain: "xiaopeng.com", cap: 12, country: "CN" },
  { name: "Lucid", ticker: "LCID", domain: "lucidmotors.com", cap: 10, country: "US" },

  // Industrials & Aero/Defense
  { name: "General Electric", ticker: "GE", domain: "ge.com", cap: 180, country: "US" },
  { name: "Honeywell", ticker: "HON", domain: "honeywell.com", cap: 130, country: "US" },
  { name: "Caterpillar", ticker: "CAT", domain: "caterpillar.com", cap: 150, country: "US" },
  { name: "Deere & Company", ticker: "DE", domain: "deere.com", cap: 110, country: "US" },
  { name: "RTX (Raytheon)", ticker: "RTX", domain: "rtx.com", cap: 120, country: "US" },
  { name: "Lockheed Martin", ticker: "LMT", domain: "lockheedmartin.com", cap: 120, country: "US" },
  { name: "Northrop Grumman", ticker: "NOC", domain: "northropgrumman.com", cap: 70, country: "US" },
  { name: "Thales", ticker: "HO.PA", domain: "thalesgroup.com", cap: 35, country: "FR" },
  { name: "Safran", ticker: "SAF.PA", domain: "safrangroup.com", cap: 100, country: "FR" },
  { name: "Rolls‑Royce Holdings", ticker: "RR.L", domain: "rolls-royce.com", cap: 45, country: "UK" },
  { name: "Schneider Electric", ticker: "SU.PA", domain: "se.com", cap: 120, country: "FR" },
  { name: "ABB", ticker: "ABBN.SW", domain: "global.abb", cap: 80, country: "CH" },
  { name: "Hitachi", ticker: "6501.T", domain: "hitachi.com", cap: 70, country: "JP" },
  { name: "Mitsubishi Electric", ticker: "6503.T", domain: "mitsubishielectric.com", cap: 30, country: "JP" },

  // Logistics & Transport
  { name: "UPS", ticker: "UPS", domain: "ups.com", cap: 130, country: "US" },
  { name: "FedEx", ticker: "FDX", domain: "fedex.com", cap: 75, country: "US" },
  { name: "DHL (Deutsche Post)", ticker: "DPW.DE", domain: "dhl.com", cap: 60, country: "DE" },
  { name: "Maersk", ticker: "MAERSK‑B.CO", domain: "maersk.com", cap: 35, country: "DK" },
  { name: "Union Pacific", ticker: "UNP", domain: "up.com", cap: 150, country: "US" },
  { name: "CSX", ticker: "CSX", domain: "csx.com", cap: 70, country: "US" },
  { name: "Norfolk Southern", ticker: "NSC", domain: "nscorp.com", cap: 50, country: "US" },
  { name: "Canadian National", ticker: "CNI", domain: "cn.ca", cap: 80, country: "CA" },
  { name: "Canadian Pacific Kansas City", ticker: "CP", domain: "cpr.ca", cap: 80, country: "CA" },

  // Real Estate & Towers
  { name: "Prologis", ticker: "PLD", domain: "prologis.com", cap: 110, country: "US" },
  { name: "American Tower", ticker: "AMT", domain: "americantower.com", cap: 90, country: "US" },
  { name: "Equinix", ticker: "EQIX", domain: "equinix.com", cap: 80, country: "US" },
  { name: "Simon Property", ticker: "SPG", domain: "simon.com", cap: 40, country: "US" },
  { name: "Realty Income", ticker: "O", domain: "realtyincome.com", cap: 45, country: "US" },
  { name: "Brookfield", ticker: "BN", domain: "brookfield.com", cap: 60, country: "CA" },

  // E‑commerce & Platforms
  { name: "eBay", ticker: "EBAY", domain: "ebay.com", cap: 25, country: "US" },
  { name: "Etsy", ticker: "ETSY", domain: "etsy.com", cap: 10, country: "US" },
  { name: "DoorDash", ticker: "DASH", domain: "doordash.com", cap: 40, country: "US" },
  { name: "Just Eat Takeaway", ticker: "TKWY.AS", domain: "justeattakeaway.com", cap: 4, country: "NL" },
  { name: "Delivery Hero", ticker: "DHER.DE", domain: "deliveryhero.com", cap: 8, country: "DE" },

  // Social & Entertainment
  { name: "Snap", ticker: "SNAP", domain: "snap.com", cap: 20, country: "US" },
  { name: "Pinterest", ticker: "PINS", domain: "pinterest.com", cap: 25, country: "US" },
  { name: "Warner Music", ticker: "WMG", domain: "wmg.com", cap: 20, country: "US" },
  { name: "Electronic Arts", ticker: "EA", domain: "ea.com", cap: 35, country: "US" },
  { name: "Take‑Two Interactive", ticker: "TTWO", domain: "take2games.com", cap: 30, country: "US" },
  { name: "Ubisoft", ticker: "UBI.PA", domain: "ubisoft.com", cap: 4, country: "FR" },

  // Food & Beverages
  { name: "Kraft Heinz", ticker: "KHC", domain: "kraftheinzcompany.com", cap: 45, country: "US" },
  { name: "General Mills", ticker: "GIS", domain: "generalmills.com", cap: 40, country: "US" },
  { name: "Kellogg (Kellanova)", ticker: "K", domain: "kellanova.com", cap: 20, country: "US" },
  { name: "Campbell Soup", ticker: "CPB", domain: "campbellsoupcompany.com", cap: 15, country: "US" },
  { name: "Tyson Foods", ticker: "TSN", domain: "tysonfoods.com", cap: 20, country: "US" },
  { name: "ADM", ticker: "ADM", domain: "adm.com", cap: 40, country: "US" },
  { name: "Cargill (private)", ticker: "CARG‑P", domain: "cargill.com", cap: 100, country: "US" },

  // Household & Home
  { name: "Wayfair", ticker: "W", domain: "wayfair.com", cap: 6, country: "US" },
  { name: "Lennar", ticker: "LEN", domain: "lennar.com", cap: 45, country: "US" },

  // Software & SaaS (more)
  { name: "Workday", ticker: "WDAY", domain: "workday.com", cap: 70, country: "US" },
  { name: "Autodesk", ticker: "ADSK", domain: "autodesk.com", cap: 50, country: "US" },
  { name: "CrowdStrike", ticker: "CRWD", domain: "crowdstrike.com", cap: 80, country: "US" },
  { name: "Fortinet", ticker: "FTNT", domain: "fortinet.com", cap: 60, country: "US" },
  { name: "Okta", ticker: "OKTA", domain: "okta.com", cap: 20, country: "US" },
  { name: "Zscaler", ticker: "ZS", domain: "zscaler.com", cap: 35, country: "US" },

  // Misc & Notable
  { name: "Philips", ticker: "PHIA.AS", domain: "philips.com", cap: 20, country: "NL" },
  { name: "Panasonic", ticker: "6752.T", domain: "panasonic.com", cap: 25, country: "JP" },
  { name: "Sharp", ticker: "6753.T", domain: "sharp.co.jp", cap: 3, country: "JP" },
  { name: "Tata Consultancy Services", ticker: "TCS.NS", domain: "tcs.com", cap: 160, country: "IN" },
  { name: "Infosys", ticker: "INFY", domain: "infosys.com", cap: 70, country: "IN" },
  { name: "Wipro", ticker: "WIPRO.NS", domain: "wipro.com", cap: 30, country: "IN" },
  { name: "HCLTech", ticker: "HCLTECH.NS", domain: "hcltech.com", cap: 40, country: "IN" },
];

const COMPANIES: Company[] = [...BASE, ...EXTRA];

// ---------- Component ----------
export default function Game() {
  // Screens
  const [screen, setScreen] = useState<"home" | "game" | "lost">("home");

  // Scores
  const [score, setScore] = useState(0);
  const [best, setBest] = useState<number>(0);
  useEffect(() => {
    try { setBest(Number(window.localStorage.getItem("mc_best_v4") || 0)); } catch {}
  }, []);

  // Round state
  const [current, setCurrent] = useState<Company>(() => COMPANIES[Math.floor(Math.random()*COMPANIES.length)]);
  const [nextCo, setNextCo] = useState<Company>(() => pickDifferent(COMPANIES, current));
  const [revealing, setRevealing] = useState(false);
  const [animatedCap, setAnimatedCap] = useState<number | null>(null);
  const [win, setWin] = useState<boolean | null>(null); // computed at guess time, shown only after reveal
  const [revealDone, setRevealDone] = useState(false);

  // RAF & timers cleanup
  const rafRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); if (timeoutRef.current) window.clearTimeout(timeoutRef.current); }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (screen !== "game") return;
      if (!revealing) {
        if (e.key === "ArrowUp" || e.key.toLowerCase() === "m") choose("more");
        if (e.key === "ArrowDown" || e.key.toLowerCase() === "l") choose("less");
      } else if (revealDone && e.key === " ") {
        finalize();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, revealing, revealDone, current, nextCo, win]);

  // Background layer
  const Bg = () => <div aria-hidden className={CL.bgFx} />;

  function startGame() {
    const start = COMPANIES[Math.floor(Math.random()*COMPANIES.length)];
    setCurrent(start); setNextCo(pickDifferent(COMPANIES, start));
    setScore(0); setWin(null); setRevealing(false); setAnimatedCap(null); setRevealDone(false);
    setScreen("game");
  }

  function share(text?: string) {
    const payload = text || `I scored ${score} on More‑or‑Less: Market Cap Chain!`;
    try {
      const nav: any = window.navigator as any;
      if (nav.share) nav.share({ title: "Market Cap Chain", text: payload, url: window.location.href });
      else {
        window.navigator.clipboard?.writeText(`${payload} \n${window.location.href}`);
        alert("Link copied to clipboard ✨");
      }
    } catch {}
  }

  function choose(which: "more" | "less") {
    if (revealing) return;
    setRevealing(true);
    setRevealDone(false);

    const isMore = nextCo.cap >= current.cap;
    setWin(which === (isMore ? "more" : "less")); // compute now, show after reveal

    // Slightly brisk animation depending on gap (1.2s – 2.1s)
    const duration = 1200 + Math.min(900, Math.abs(nextCo.cap - current.cap) * 2.5);
    animateCountUp(nextCo.cap, duration);
  }

  function animateCountUp(targetBn: number, durationMs: number) {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const start = performance.now();
    const base = Math.max(1, Math.round(targetBn * 0.25));
    setAnimatedCap(base);

    const frame = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = easeOutCubic(t);
      const val = Math.round(base + (targetBn - base) * eased);
      setAnimatedCap(val);
      if (t < 1) rafRef.current = requestAnimationFrame(frame); else { setRevealDone(true); setAnimatedCap(targetBn); }
    };
    rafRef.current = requestAnimationFrame(frame);
  }

  // Auto-continue shortly after reveal
  useEffect(() => {
    if (!revealing || !revealDone) return;
    timeoutRef.current = window.setTimeout(() => finalize(), 800);
    return () => { if (timeoutRef.current) window.clearTimeout(timeoutRef.current); };
  }, [revealing, revealDone, win]);

  function finalize() {
    if (!revealing) return;
    if (win) {
      const ns = score + 1; setScore(ns);
      if (ns > best) { setBest(ns); try { window.localStorage.setItem("mc_best_v4", String(ns)); } catch {} }
      const newCurrent = nextCo; // chain forward
      setCurrent(newCurrent); setNextCo(pickDifferent(COMPANIES, newCurrent));
      setRevealing(false); setAnimatedCap(null); setRevealDone(false); setWin(null);
    } else {
      setScreen("lost");
    }
  }

  return (
    <div className={CL.page}>
      <Bg />
      <div className={CL.wrap}>
        {screen === "home" && <Home onPlay={startGame} onShare={share} best={best} />}

        {screen === "game" && (
          <motion.div
            // wrapper shake only if wrong + revealed
            animate={revealDone && win === false ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
            transition={{ x: { type: "tween", duration: 0.5 } }}
          >
            <HUD score={score} best={best} />
            <Board
              current={current}
              nextCo={nextCo}
              revealing={revealing}
              revealDone={revealDone}
              animatedCap={animatedCap}
              win={win}
              onMore={() => choose("more")}
              onLess={() => choose("less")}
            />
            <div className="mt-6 text-center text-xs text-slate-300/80">Shortcuts: <kbd className="px-1 py-0.5 rounded bg-white/10">↑</kbd>/<kbd className="px-1 py-0.5 rounded bg-white/10">M</kbd> = More, <kbd className="px-1 py-0.5 rounded bg-white/10">↓</kbd>/<kbd className="px-1 py-0.5 rounded bg-white/10">L</kbd> = Less, Space after reveal to continue.</div>
          </motion.div>
        )}

        {screen === "lost" && <Lost score={score} best={best} onPlayAgain={startGame} onShare={() => share(`I scored ${score}! Can you beat me?`)} />}
      </div>
    </div>
  );
}

// ---------- Sub-components ----------
function HUD({ score, best }: { score: number; best: number }) {
  return (
    <div className={CL.hud}>
      <div>Score: <span className="text-slate-100 font-semibold">{score}</span></div>
      <div>Highscore: <span className="text-slate-100 font-semibold">{best}</span></div>
    </div>
  );
}

function Home({ onPlay, onShare, best }: { onPlay: () => void; onShare: () => void; best: number }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">More‑or‑Less — <span className="text-blue-300">Market Cap Chain</span></h1>
      <p className="mt-3 max-w-2xl text-slate-300/90">Guess if the next company is worth <span className="font-semibold text-slate-100">more</span> or <span className="font-semibold text-slate-100">less</span> than the current one. Get it right to extend your chain.</p>
      <div className="mt-8 flex items-center gap-3">
        <button onClick={onPlay} className={CL.btnPrimary}><PlayCircle className="w-5 h-5 mr-2"/>Play</button>
        <button onClick={onShare} className={CL.btnGhost}><Share2 className="w-5 h-5 mr-2"/>Share</button>
      </div>
      <div className="mt-8 text-sm text-slate-300 flex items-center gap-2"><Trophy className="w-4 h-4 text-blue-300"/> Best: <span className="font-semibold text-slate-100">{best}</span></div>
      <p className="mt-10 text-xs text-slate-400">Logos: Clearbit (fallback). Market caps are approximate (USD, billions) for gameplay only.</p>
    </div>
  );
}

function Lost({ score, best, onPlayAgain, onShare }: { score: number; best: number; onPlayAgain: () => void; onShare: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <motion.div initial={{ scale: .92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
        <XCircle className="w-16 h-16 text-red-400"/>
        <h2 className="mt-3 text-2xl font-semibold">Chain broken</h2>
        <p className="mt-1 text-slate-300">Score: <span className="font-semibold text-white">{score}</span> — Best: <span className="font-semibold text-white">{best}</span></p>
        <div className="mt-6 flex items-center gap-3">
          <button onClick={onPlayAgain} className={CL.btnPrimary}>Play again</button>
          <button onClick={onShare} className={CL.btnGhost}><Share2 className="w-4 h-4 mr-1"/>Share score</button>
        </div>
      </motion.div>
    </div>
  );
}

function Board({ current, nextCo, revealing, revealDone, animatedCap, win, onMore, onLess }:
  { current: Company; nextCo: Company; revealing: boolean; revealDone: boolean; animatedCap: number | null; win: boolean | null; onMore: () => void; onLess: () => void }) {

  const resultVisible = revealDone; // only show result after reveal
  const ringClass = resultVisible ? (win ? "ring-2 ring-green-400/70" : "ring-2 ring-red-400/70") : "";

  return (
    <div className={CL.grid}>
      {/* Current */}
      <motion.div layout className={CL.card} initial={{ x: -20, opacity: .95 }} animate={{ x: 0, opacity: 1 }}>
        <Logo domain={current.domain} name={current.name} />
        <div className={CL.title}>{current.name}</div>
        <div className={CL.meta}>{current.ticker} • {current.country}</div>
        <div className="mt-1 text-[11px] text-slate-400">Reference</div>
        <div className={CL.cap}>{formatCapB(current.cap)}</div>
      </motion.div>

      {/* Challenger */}
      <motion.div
        layout
        className={`${CL.card} ${ringClass}`}
        initial={{ x: 20, opacity: .95 }}
        animate={{
          x: resultVisible && win === false ? [0, -6, 6, -4, 4, 0] : 0,
          opacity: 1,
          scale: resultVisible && win ? 1.03 : 1,
        }}
        transition={{
          x: { type: "tween", duration: 0.5 },
          scale: { type: "spring", stiffness: 220, damping: 20 },
        }}
      >
        <Logo domain={nextCo.domain} name={nextCo.name} />
        <div className={CL.title}>{nextCo.name}</div>
        <div className={CL.meta}>{nextCo.ticker} • {nextCo.country}</div>
        <div className="mt-1 text-[11px] text-slate-400">Challenger</div>

        {!revealing ? (
          <div className={CL.unknown}>????</div>
        ) : (
          <div className="relative">
            <motion.div key="reveal" initial={{ scale: .9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={CL.cap}>
              {formatCapB(animatedCap ?? nextCo.cap)}
            </motion.div>
            {/* Subtle green pulse only when reveal completed & correct */}
            {resultVisible && win === true && (
              <motion.div
                initial={{ opacity: 0, scale: .95 }}
                animate={{ opacity: [0, .55, 0], scale: [0.95, 1.08, 1] }}
                transition={{ duration: .8, ease: "easeOut" }}
                className="pointer-events-none absolute -inset-3 rounded-xl bg-green-400/20 blur-xl"
              />
            )}
          </div>
        )}

        {!revealing ? (
          <div className="mt-2 flex items-center gap-3">
            <button onClick={onMore} className={CL.btnPrimary}><ArrowUp className="w-4 h-4 mr-2"/>More</button>
            <button onClick={onLess} className={CL.btnGhost}><ArrowDown className="w-4 h-4 mr-2"/>Less</button>
          </div>
        ) : (
          <AnimatePresence>
            {resultVisible && win === true && (
              <motion.div key="winNote" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 flex items-center gap-2 text-green-300">
                <CheckCircle2 className="w-5 h-5"/> Correct — chaining next…
              </motion.div>
            )}
            {resultVisible && win === false && (
              <motion.div key="loseNote" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-2 flex items-center gap-2 text-red-300">
                <XCircle className="w-5 h-5"/> Wrong — chain ends…
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
}

function Logo({ domain, name }: { domain: string; name: string }) {
  const [fail, setFail] = useState(false);
  return (
    <div className={CL.logoBox}>
      {!fail ? (
        <img src={logoUrl(domain)} alt={`${name} logo`} className="w-full h-full object-contain" onError={() => setFail(true)} />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-blue-400/10 flex items-center justify-center text-blue-300 font-semibold">
            {name.charAt(0)}
          </div>
        </div>
      )}
    </div>
  );
}
    