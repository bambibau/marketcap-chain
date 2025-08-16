"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Share2, PlayCircle, XCircle, CheckCircle2, ArrowUp, ArrowDown } from "lucide-react";

/*
Final build — Reveal-after + 200+ companies + Animated Home
-----------------------------------------------------------
• Press More/Less → THEN the number animates upward (slightly brisk, eases near the end).
• Result (correct/wrong) ONLY shown after the number fully reveals.
• Subtle feedback: green pulse on correct; red ring + shake on wrong.
• Chain mechanic: last shown stays as reference.
• LocalStorage handled on client only (SSR-safe) for highscore.
• Framer Motion: keyframe shakes use tween for x (spring only for scale) → fixes error.
• Logos via Clearbit <img> (no Next Image domain config needed).
• Tailwind colors: blue/grey/white palette.
• NEW: Home screen with animated aurora background, marquee logos, and feature cards.
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
  { name: "Sanofi", ticker: "SAN.PA", domain: "sanofi.com", cap: 140, country: "FR" },
  { name: "AstraZeneca", ticker: "AZN", domain: "astrazeneca.com", cap: 240, country: "UK" },
  { name: "GlaxoSmithKline", ticker: "GSK", domain: "gsk.com", cap: 80, country: "UK" },
  { name: "Bayer", ticker: "BAYN.DE", domain: "bayer.com", cap: 50, country: "DE" },
  { name: "Siemens Healthineers", ticker: "SHL.DE", domain: "siemens-healthineers.com", cap: 70, country: "DE" },
  { name: "Medtronic", ticker: "MDT", domain: "medtronic.com", cap: 120, country: "IE" },

  // Consumer & Retail
  { name: "Starbucks", ticker: "SBUX", domain: "starbucks.com", cap: 100, country: "US" },
  { name: "McDonald's", ticker: "MCD", domain: "mcdonalds.com", cap: 200, country: "US" },
  { name: "Chipotle", ticker: "CMG", domain: "chipotle.com", cap: 90, country: "US" },
  { name: "Target", ticker: "TGT", domain: "target.com", cap: 80, country: "US" },
  { name: "Lowe's", ticker: "LOW", domain: "lowes.com", cap: 120, country: "US" },
  { name: "IKEA (Ingka)", ticker: "INGKA-P", domain: "ikea.com", cap: 70, country: "SE" },
  { name: "Inditex (Zara)", ticker: "ITX.MC", domain: "inditex.com", cap: 150, country: "ES" },
  { name: "H&M", ticker: "HM-B.ST", domain: "hm.com", cap: 30, country: "SE" },
  { name: "L'Oréal", ticker: "OR.PA", domain: "loreal.com", cap: 250, country: "FR" },
  { name: "Estée Lauder", ticker: "EL", domain: "esteelauder.com", cap: 80, country: "US" },
  { name: "Hermès", ticker: "RMS.PA", domain: "hermes.com", cap: 250, country: "FR" },
  { name: "Kering", ticker: "KER.PA", domain: "kering.com", cap: 60, country: "FR" },

  // Autos & Mobility
  { name: "Mercedes-Benz Group", ticker: "MBG.DE", domain: "mercedes-benz.com", cap: 75, country: "DE" },
  { name: "BMW", ticker: "BMW.DE", domain: "bmw.com", cap: 70, country: "DE" },
  { name: "Stellantis", ticker: "STLAM.MI", domain: "stellantis.com", cap: 65, country: "NL" },
  { name: "Ford", ticker: "F", domain: "ford.com", cap: 55, country: "US" },
  { name: "General Motors", ticker: "GM", domain: "gm.com", cap: 55, country: "US" },
  { name: "Honda", ticker: "7267.T", domain: "global.honda", cap: 55, country: "JP" },
  { name: "Hyundai", ticker: "005380.KS", domain: "hyundai.com", cap: 55, country: "KR" },

  // Industrials & Capital Goods
  { name: "Caterpillar", ticker: "CAT", domain: "caterpillar.com", cap: 170, country: "US" },
  { name: "Deere & Company", ticker: "DE", domain: "deere.com", cap: 110, country: "US" },
  { name: "3M", ticker: "MMM", domain: "3m.com", cap: 50, country: "US" },
  { name: "Honeywell", ticker: "HON", domain: "honeywell.com", cap: 120, country: "US" },
  { name: "Lockheed Martin", ticker: "LMT", domain: "lockheedmartin.com", cap: 130, country: "US" },
  { name: "RTX (Raytheon)", ticker: "RTX", domain: "rtx.com", cap: 120, country: "US" },
  { name: "Northrop Grumman", ticker: "NOC", domain: "northropgrumman.com", cap: 70, country: "US" },
  { name: "BAE Systems", ticker: "BA.L", domain: "baesystems.com", cap: 40, country: "UK" },
  { name: "Vinci", ticker: "DG.PA", domain: "vinci.com", cap: 70, country: "FR" },
  { name: "ACS", ticker: "ACS.MC", domain: "acs.es", cap: 10, country: "ES" },

  // Energy & Materials
  { name: "Shell", ticker: "SHEL", domain: "shell.com", cap: 300, country: "UK" },
  { name: "BP", ticker: "BP.L", domain: "bp.com", cap: 110, country: "UK" },
  { name: "TotalEnergies", ticker: "TTE", domain: "totalenergies.com", cap: 160, country: "FR" },
  { name: "Equinor", ticker: "EQNR", domain: "equinor.com", cap: 90, country: "NO" },
  { name: "BHP", ticker: "BHP", domain: "bhp.com", cap: 150, country: "AU" },
  { name: "Rio Tinto", ticker: "RIO", domain: "riotinto.com", cap: 110, country: "UK" },

  // Utilities & Telecom
  { name: "NextEra Energy", ticker: "NEE", domain: "nexteraenergy.com", cap: 110, country: "US" },
  { name: "Enel", ticker: "ENEL.MI", domain: "enel.com", cap: 70, country: "IT" },
  { name: "Iberdrola", ticker: "IBE.MC", domain: "iberdrola.com", cap: 85, country: "ES" },
  { name: "AT&T", ticker: "T", domain: "att.com", cap: 120, country: "US" },
  { name: "Verizon", ticker: "VZ", domain: "verizon.com", cap: 160, country: "US" },
  { name: "T‑Mobile US", ticker: "TMUS", domain: "t-mobile.com", cap: 200, country: "US" },
  { name: "Vodafone", ticker: "VOD.L", domain: "vodafone.com", cap: 25, country: "UK" },
  { name: "Orange", ticker: "ORA.PA", domain: "orange.com", cap: 27, country: "FR" },

  // Airlines & Hotels
  { name: "Delta Air Lines", ticker: "DAL", domain: "delta.com", cap: 30, country: "US" },
  { name: "United Airlines", ticker: "UAL", domain: "united.com", cap: 20, country: "US" },
  { name: "Ryanair", ticker: "RYAAY", domain: "ryanair.com", cap: 25, country: "IE" },
  { name: "Marriott", ticker: "MAR", domain: "marriott.com", cap: 70, country: "US" },
  { name: "Hilton", ticker: "HLT", domain: "hilton.com", cap: 60, country: "US" },

  // Media & Entertainment
  { name: "Disney", ticker: "DIS", domain: "thewaltdisneycompany.com", cap: 180, country: "US" },
  { name: "Comcast", ticker: "CMCSA", domain: "corporate.comcast.com", cap: 170, country: "US" },
  { name: "Paramount Global", ticker: "PARA", domain: "paramount.com", cap: 8, country: "US" },
  { name: "Warner Bros. Discovery", ticker: "WBD", domain: "wbd.com", cap: 20, country: "US" },

  // Food Retail & Beverages
  { name: "Walmart", ticker: "WMT", domain: "walmart.com", cap: 500, country: "US" },
  { name: "Carrefour", ticker: "CA.PA", domain: "carrefour.com", cap: 12, country: "FR" },
  { name: "Ahold Delhaize", ticker: "AD.AS", domain: "aholddelhaize.com", cap: 30, country: "NL" },
  { name: "Heineken", ticker: "HEIA.AS", domain: "heineken.com", cap: 50, country: "NL" },
  { name: "AB InBev", ticker: "ABI.BR", domain: "ab-inbev.com", cap: 100, country: "BE" },
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
        if (e.key === "ArrowUp" || (e.key as any).toLowerCase?.() === "m") choose("more");
        if (e.key === "ArrowDown" || (e.key as any).toLowerCase?.() === "l") choose("less");
      } else if (revealDone && e.key === " ") {
        finalize();
      }
    }
    window.addEventListener("keydown", onKey as any);
    return () => window.removeEventListener("keydown", onKey as any);
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
        window.navigator.clipboard?.writeText(`${payload} 
${window.location.href}`);
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
  const marquee = [
    { name: "Apple", domain: "apple.com" },
    { name: "Microsoft", domain: "microsoft.com" },
    { name: "NVIDIA", domain: "nvidia.com" },
    { name: "Amazon", domain: "amazon.com" },
    { name: "Alphabet", domain: "google.com" },
    { name: "Meta", domain: "meta.com" },
    { name: "Tesla", domain: "tesla.com" },
    { name: "LVMH", domain: "lvmh.com" },
    { name: "Coca-Cola", domain: "coca-cola.com" },
    { name: "Toyota", domain: "toyota-global.com" },
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-10 md:p-14 text-center">
      {/* Aurora / blobs animés dans le fond */}
      <AuroraBackground />

      {/* Titre + sous-titre */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: .6 }}
        className="text-3xl md:text-5xl font-bold tracking-tight"
      >
        More-or-Less — <span className="text-blue-300">Market Cap Chain</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: .1, duration: .5 }}
        className="mt-3 max-w-2xl mx-auto text-slate-300/90"
      >
        Guess if the next company is worth <span className="font-semibold text-slate-100">more</span> or{" "}
        <span className="font-semibold text-slate-100">less</span> than the current one. Get it right to extend your chain.
      </motion.p>

      {/* CTA */}
      <div className="mt-8 flex items-center justify-center gap-3 relative">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: .98 }}
          className={CL.btnPrimary}
          onClick={onPlay}
        >
          <PlayCircle className="w-5 h-5 mr-2" />
          Play
        </motion.button>

        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: .98 }} className={CL.btnGhost} onClick={onShare}>
          <Share2 className="w-5 h-5 mr-2" />
          Share
        </motion.button>

        {/* halo discret qui “respire” */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute -inset-6 rounded-3xl"
          style={{ boxShadow: "0 0 120px 40px rgba(59,130,246,.15)" }}
          animate={{ opacity: [0.25, 0.55, 0.25] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Stats + best */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: .15 }}
        className="mt-10 md:mt-12 flex items-center justify-center gap-6 text-sm text-slate-300"
      >
        <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10">200+ companies</div>
        <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10">No signup</div>
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-blue-300" />
          Best: <span className="font-semibold text-white">{best}</span>
        </div>
      </motion.div>


      {/* Marquee logos */}
      <div className="mt-10">
        <LogoMarquee items={marquee} />
      </div>

      {/* How it works */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
        <FeatureCard
          icon={<ArrowUp className="w-5 h-5" />}
          title="Make your guess"
          text="Choose More or Less based on the next company."
        />
        <FeatureCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          title="Animated reveal"
          text="Market cap counts up and slows down near the final value."
        />
        <FeatureCard
          icon={<Trophy className="w-5 h-5" />}
          title="Chain to score"
          text="Each correct guess extends your chain and raises your score."
        />
      </div>

      <p className="mt-8 text-[11px] text-slate-400">
        Logos: Clearbit (fallback). Market caps are approximate (USD, billions) for gameplay only.
      </p>
    </div>
  );
}

function Lost({
  score,
  best,
  onPlayAgain,
  onShare,
}: {
  score: number;
  best: number;
  onPlayAgain: () => void;
  onShare: () => void;
}) {
  return (
    <div className="relative py-20">
      {/* Fond animé rouge discret */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(45% 30% at 60% -10%, rgba(239,68,68,.14), transparent), radial-gradient(40% 25% at 10% 110%, rgba(244,63,94,.10), transparent)",
        }}
        animate={{ opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative max-w-3xl mx-auto text-center">
        {/* Titre + halo doux */}
        <div className="relative inline-block">
          <XCircle className="mx-auto w-16 h-16 text-red-400" />
          <motion.span
            aria-hidden
            className="absolute -inset-6 rounded-full"
            style={{ boxShadow: "0 0 100px 30px rgba(239,68,68,.15)" }}
            animate={{ opacity: [0.2, 0.45, 0.2], scale: [0.95, 1.05, 0.95] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <h2 className="mt-3 text-2xl font-semibold">Chain broken</h2>
        <p className="mt-1 text-slate-300">
          Your streak ended — but the next one starts now.
        </p>

        {/* Chips score/best */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
          <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            Score: <span className="font-semibold text-white">{score}</span>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            Best: <span className="font-semibold text-white">{best}</span>
          </div>
        </div>

        {/* Carte conseils */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <div className="text-sm font-semibold text-slate-100">Quick tip</div>
            <div className="mt-1 text-sm text-slate-300/90">
              Check <span className="text-slate-100 font-medium">sector size</span> and{" "}
              <span className="text-slate-100 font-medium">mega-cap outliers</span> first.
            </div>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <div className="text-sm font-semibold text-slate-100">Pattern</div>
            <div className="mt-1 text-sm text-slate-300/90">
              Platforms & chips often sit{" "}
              <span className="text-slate-100 font-medium">higher</span> than you think.
            </div>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <div className="text-sm font-semibold text-slate-100">Mind the gap</div>
            <div className="mt-1 text-sm text-slate-300/90">
              If unsure, favor the option with{" "}
              <span className="text-slate-100 font-medium">smaller jump</span>.
            </div>
          </div>
        </div>

        {/* Séparateur lumineux */}
        <motion.div
          aria-hidden
          className="mx-auto mt-8 h-px w-40 bg-gradient-to-r from-transparent via-red-400/50 to-transparent"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* CTA */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button onClick={onPlayAgain} className={CL.btnPrimary}>
            Try again
          </button>
          <button onClick={onShare} className={CL.btnGhost}>
            <Share2 className="w-4 h-4 mr-1" />
            Share score
          </button>
          {/* Bouton Home */}
          <a href="/" className={CL.btnGhost}>
            Home
          </a>
        </div>

        {/* Rappel raccourcis */}
        <div className="mt-4 text-xs text-slate-400">
          Tip: Use <kbd className="px-1 py-0.5 rounded bg-white/10">↑</kbd> /{" "}
          <kbd className="px-1 py-0.5 rounded bg-white/10">↓</kbd> or <kbd className="px-1 py-0.5 rounded bg-white/10">M</kbd> /{" "}
          <kbd className="px-1 py-0.5 rounded bg-white/10">L</kbd> to go faster.
        </div>
      </div>
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
          <div className="mt-4 flex items-center gap-3">
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

function AuroraBackground() {
  return (
    <>
      <motion.div
        aria-hidden
        className="absolute -top-40 -right-24 w-[34rem] h-[34rem] rounded-full bg-blue-500/20 blur-3xl"
        animate={{ opacity: [.15, .35, .15], scale: [1, 1.06, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute -bottom-40 -left-24 w-[30rem] h-[30rem] rounded-full bg-sky-400/15 blur-3xl"
        animate={{ opacity: [.12, .28, .12], scale: [1, 1.08, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
    </>
  );
}

function FeatureCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <motion.div
      initial={{ y: 12, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, amount: .5 }}
      transition={{ duration: .4 }}
      className="rounded-xl bg-white/5 border border-white/10 p-4"
    >
      <div className="flex items-center gap-2 text-slate-100">
        <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-200 border border-white/10">{icon}</div>
        <div className="font-semibold">{title}</div>
      </div>
      <div className="mt-1.5 text-sm text-slate-300/90">{text}</div>
    </motion.div>
  );
}

function LogoMarquee({ items }: { name: string; domain: string }[]) {
  const SPEED = 60; // px/s
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [w, setW] = React.useState(0);

  // Mesure sûre (pas de setState dans le callback RO)
  React.useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const el = trackRef.current;
    if (!el) return;

    const measure = () => setW(el.scrollWidth);
    const rAF = () => requestAnimationFrame(measure);

    // 1) première mesure après paint
    const id = requestAnimationFrame(measure);

    // 2) observe redimensionnements (throttlé via rAF)
    let ro: ResizeObserver | null = null;
    if ("ResizeObserver" in window) {
      ro = new ResizeObserver(() => rAF());
      ro.observe(el);
    }

    // 3) re-mesure quand les images chargent
    const onImg = () => rAF();
    const imgs = Array.from(el.querySelectorAll<HTMLImageElement>("img"));
    imgs.forEach((img) => {
      if (!img.complete) {
        img.addEventListener("load", onImg, { once: true });
        img.addEventListener("error", onImg, { once: true });
      }
    });

    return () => {
      cancelAnimationFrame(id);
      ro?.disconnect();
      imgs.forEach((img) => {
        img.removeEventListener("load", onImg);
        img.removeEventListener("error", onImg);
      });
    };
  }, [items]);

  const duration = w > 0 ? w / SPEED : 20;

  const Row = React.useCallback(
    ({ withRef = false }: { withRef?: boolean }) => (
      <div
        ref={withRef ? trackRef : undefined}
        className="flex items-center gap-6 pr-6 shrink-0"
      >
        {items.map((it, i) => (
          <div
            key={`${it.domain}-${i}`}
            className="h-12 w-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden"
          >
            <img
              src={`https://logo.clearbit.com/${it.domain}?size=128`}
              alt={`${it.name} logo`}
              className="h-9 w-9 object-contain"
              title={it.name}
              loading="eager"
              decoding="async"
              onError={(e) => ((e.currentTarget.style.opacity = "0.4"))}
            />
          </div>
        ))}
      </div>
    ),
    [items]
  );

  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  return (
    <div className="relative overflow-hidden">
      {prefersReduced || w === 0 ? (
        <Row withRef />
      ) : (
        <motion.div
          className="flex"
          animate={{ x: [0, -w] }}
          transition={{ duration, ease: "linear", repeat: Infinity }}
          style={{ willChange: "transform" }}
        >
          <Row withRef />
          <Row />
        </motion.div>
      )}
    </div>
  );
}
