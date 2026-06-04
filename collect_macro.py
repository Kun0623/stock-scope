import os
import json
import re
import sys
import time
from datetime import datetime, timezone, timedelta

import requests
from bs4 import BeautifulSoup
import yfinance as yf

# 🚀 [추가] AI 뉴스 분석용 라이브러리
import feedparser
import google.generativeai as genai

FRED_API_KEY = "***REMOVED***"
FRED_BASE = "https://api.stlouisfed.org/fred/series/observations"
OUTPUT_FILE = "public/macro_status.json"

# 🚀 [보안] 깃허브 Secrets에서 환경변수로 키를 가져옵니다.
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Connection": "keep-alive",
}

KST = timezone(timedelta(hours=9))


def fetch_fred(series_id: str) -> float:
    time.sleep(1)  # 연준 서버 방어용 숨 고르기
    params = {
        "series_id": series_id,
        "api_key": FRED_API_KEY,
        "file_type": "json",
        "sort_order": "desc",
        "limit": 5,
    }
    resp = requests.get(FRED_BASE, params=params, headers=HEADERS, timeout=15)
    resp.raise_for_status()
    data = resp.json()
    for obs in data["observations"]:
        if obs["value"] != ".":
            return float(obs["value"])
    raise ValueError(f"{series_id} 유효 데이터 없음")


def get_sahm_rule() -> dict:
    try:
        value = fetch_fred("SAHMCURRENT")
        return {"value": round(value, 2), "status": "Recession" if value >= 0.5 else "Normal"}
    except Exception as e:
        print(f"[WARN] Sahm Failed: {e}", file=sys.stderr)
        return {"value": None, "status": "Unavailable"}


def get_high_yield_spread() -> dict:
    try:
        value = fetch_fred("BAMLH0A0HYM2")
        return {"value": round(value, 2), "status": "High Risk" if value >= 5.0 else "Normal"}
    except Exception as e:
        print(f"[WARN] HY Spread Failed: {e}", file=sys.stderr)
        return {"value": None, "status": "Unavailable"}


def get_yield_curve() -> dict:
    try:
        value = fetch_fred("T10Y2Y")
        return {"value": round(value, 2), "status": "Inverted" if value < 0 else "Normal"}
    except Exception as e:
        print(f"[WARN] Yield Failed: {e}", file=sys.stderr)
        return {"value": None, "status": "Unavailable"}


def get_fear_greed() -> dict:
    url = "https://production.dataviz.cnn.io/index/fearandgreed/graphdata"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        score = resp.json().get("fear_and_greed", {}).get("score")
        if score is not None:
            return {"value": round(float(score)), "status": "Normal"}
    except Exception as e:
        print(f"[WARN] CNN API Failed: {e}", file=sys.stderr)
    return {"value": 50, "status": "Neutral"}


def get_buffett_indicator() -> dict:
    try:
        w5000 = yf.Ticker("^W5000").history(period="5d")
        gdp = fetch_fred("GDP")
        if not w5000.empty and gdp:
            ratio = (float(w5000['Close'].iloc[-1]) / gdp) * 100
            return {"value": round(ratio, 1), "status": "Overvalued" if ratio >= 180 else "Normal"}
    except Exception as e:
        print(f"[WARN] Buffett Failed: {e}", file=sys.stderr)
    return {"value": None, "status": "Unavailable"}


def get_vix_index() -> dict:
    try:
        vix = yf.Ticker("^VIX").history(period="2d")
        if not vix.empty:
            val = float(vix['Close'].iloc[-1])
            return {"value": round(val, 2), "status": "Panic" if val >= 25 else "Stable"}
    except Exception as e:
        print(f"[WARN] VIX Failed: {e}", file=sys.stderr)
    return {"value": None, "status": "Unavailable"}


def get_fx_data() -> dict:
    try:
        dxy = yf.Ticker("DX-Y.NYB").history(period="2d")
        krw = yf.Ticker("KRW=X").history(period="2d")
        return {
            "dxy": round(float(dxy['Close'].iloc[-1]), 2) if not dxy.empty else None,
            "usd_krw": round(float(krw['Close'].iloc[-1]), 1) if not krw.empty else None
        }
    except Exception as e:
        print(f"[WARN] FX Failed: {e}", file=sys.stderr)
    return {"dxy": None, "usd_krw": None}


def get_theme_trends() -> dict:
    themes = {
        "mega": {
            "AIQ": "인공지능 & 빅데이터",
            "SKYY": "클라우드 컴퓨팅",
            "CIBR": "사이버 보안",
            "BOTZ": "로봇공학 & 자동화"
        },
        "recent": {
            "BLOK": "웹 3.0 & 블록체인",
            "QTUM": "양자컴퓨팅 & 차세대 통신",
            "ITA": "우주항공 & 국방",
            "URA": "우라늄 & 차세대 에너지"
        }
    }
    
    results = {"mega": [], "recent": []}
    print("📡 글로벌 메가 & 이머징 테마 트렌드 수집 시작...")
    
    for category, etfs in themes.items():
        for ticker, name in etfs.items():
            try:
                hist = yf.Ticker(ticker).history(period="2d")
                if not hist.empty and len(hist) >= 2:
                    curr = float(hist['Close'].iloc[-1])
                    prev = float(hist['Close'].iloc[-2])
                    change = ((curr - prev) / prev) * 100
                    results[category].append({
                        "ticker": ticker, 
                        "name": name, 
                        "change_pct": round(change, 2)
                    })
            except Exception as e:
                print(f"    [오류] {ticker} 수집 실패: {e}")
                
        results[category].sort(key=lambda x: x["change_pct"], reverse=True)
        
    return results


def get_sector_data() -> list:
    sectors = {
        "XLK": "기술 (Tech)", "XLF": "금융 (Financials)", "XLV": "헬스케어 (Health Care)", 
        "XLE": "에너지 (Energy)", "XLY": "임의소비재 (Discretionary)", "XLP": "필수소비재 (Staples)",
        "XLI": "산업재 (Industrials)", "XLB": "소재 (Materials)", "XLRE": "부동산 (Real Estate)", 
        "XLU": "유틸리티 (Utilities)", "XLC": "통신 (Communication)", "SMH": "반도체 (Semiconductors)"
    }
    results = []
    print("🌍 S&P 500 12개 상세 섹터 수집 시작...")
    for ticker, name in sectors.items():
        try:
            hist = yf.Ticker(ticker).history(period="2d")
            if not hist.empty and len(hist) >= 2:
                curr = float(hist['Close'].iloc[-1])
                prev = float(hist['Close'].iloc[-2])
                change = ((curr - prev) / prev) * 100
                results.append({"ticker": ticker, "name": name, "change_pct": round(change, 2)})
        except Exception as e:
            print(f"    [오류] {ticker} 수집 실패: {e}")
    results.sort(key=lambda x: x["change_pct"], reverse=True)
    return results


# 🚀 [수정] AI 뉴스 스크래핑 및 센티먼트 요약 함수 (뉴스 출처 리스트 추가)
def get_ai_news_sentiment() -> dict:
    if not GEMINI_API_KEY:
        print("⚠️ Gemini API 키가 설정되지 않았습니다.")
        return {
            "sentiment_score": 50, 
            "summary": ["AI 뉴스 분석을 위해 GitHub Secrets에 GEMINI_API_KEY 설정이 필요합니다.", "코드를 업데이트해 주세요.", ""],
            "news_sources": []
        }

    print("📡 글로벌 경제 뉴스 RSS 수집 및 AI 분석 시작...")
    try:
        # 가장 안정적이고 빠른 구글 뉴스(미국 경제/기술) RSS
        rss_url = "https://news.google.com/rss/search?q=stock+market+OR+technology+OR+economy&hl=en-US&gl=US&ceid=US:en"
        feed = feedparser.parse(rss_url)
        
        # 데이터가 비어있는지 1차 방어
        if not feed.entries:
            raise ValueError("RSS 피드에서 뉴스를 가져오지 못했습니다. URL을 확인하세요.")
            
        # 최근 20개 헤드라인 추출
        headlines = [entry.title for entry in feed.entries[:20]]
        news_text = "\n".join(headlines)
        
        # ✨ 프롬프트 대대적 수정: news_sources 배열을 명시적으로 반환하도록 지시
        prompt = f"""
        너는 퀀트 애널리스트야. 다음은 방금 수집된 글로벌 경제 뉴스 헤드라인 20개야.
        
        {news_text}
        
        이 뉴스들을 분석해서 다음 JSON 형식으로만 완벽하게 대답해. 다른 인사말이나 설명은 절대 넣지 마.
        
        1. sentiment_score: 시장의 긍정/부정 상태를 0(극단적 공포)에서 100(탐욕/상승장) 사이 정수로 평가.
        2. summary: 엔비디아, 아이온큐 등 기술주 모멘텀 환경과 매크로 시황을 결합하여, 현재 시장 핵심 트렌드를 명확하고 간결하게 3줄로 요약 (한국어).
        3. news_sources: 위 20개 헤드라인 중 가장 중요하다고 판단되는 3~5개의 뉴스를 선정하여, 각각의 출처(provider), 제목(title), 그리고 1~2문장의 간략한 한글 요약(summary)을 작성해. 출처(provider)는 뉴스 제목에 포함된 언론사 이름(예: Bloomberg, Reuters, Yahoo Finance 등)을 추출해서 써줘.
        
        출력 형식:
        {{
            "sentiment_score": 75,
            "summary": [
                "1. 첫 번째 요약",
                "2. 두 번째 요약",
                "3. 세 번째 요약"
            ],
            "news_sources": [
                {{
                    "provider": "Bloomberg",
                    "title": "실제 뉴스 원본 제목 (또는 번역된 제목)",
                    "summary": "해당 뉴스에 대한 1~2문장의 간략한 한글 요약 내용"
                }}
            ]
        }}
        """
        
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)
        
        # AI가 인사말을 섞더라도 순수 JSON만 뜯어내는 강력한 정규식(Regex) 방어
        match = re.search(r'\{.*\}', response.text, re.DOTALL)
        
        if match:
            raw_json = match.group(0)
            return json.loads(raw_json)
        else:
            raise ValueError(f"AI 응답에서 JSON 형식을 찾을 수 없습니다. 원본: {response.text}")
        
    except Exception as e:
        print(f"❌ AI 센티먼트 분석 실패: {e}")
        return {
            "sentiment_score": 50,
            "summary": ["현재 글로벌 뉴스 데이터를 수집하거나 AI로 분석하는 중입니다.", "API 서버 트래픽 초과이거나 처리 중일 수 있습니다.", "다음 업데이트 주기(15분 후)에 다시 확인해 주세요."],
            "news_sources": []
        }


def calculate_quant_risk_score(fg, vix, yc, sahm, hy) -> int:
    score = 0
    weight_total = 0
    
    if fg and fg.get("value") is not None:
        score += (100 - fg["value"]) * 0.25 
        weight_total += 0.25
    if vix and vix.get("value") is not None:
        vix_risk = max(0, min(100, ((vix["value"] - 12) / (35 - 12)) * 100)) 
        score += vix_risk * 0.25
        weight_total += 0.25
    if yc and yc.get("value") is not None:
        yc_risk = max(0, min(100, ((0.4 - yc["value"]) / 0.8) * 100)) 
        score += yc_risk * 0.20
        weight_total += 0.20
    if sahm and sahm.get("value") is not None:
        sahm_risk = max(0, min(100, (sahm["value"] / 0.6) * 100)) 
        score += sahm_risk * 0.15
        weight_total += 0.15
    if hy and hy.get("value") is not None:
        hy_risk = max(0, min(100, ((hy["value"] - 3.0) / 3.0) * 100)) 
        score += hy_risk * 0.15
        weight_total += 0.15

    return round(score / weight_total) if weight_total > 0 else 50


def main():
    print("📡 안안(AnAn) 고도화 통합 매크로 엔진 가동...\n")
    sahm = get_sahm_rule()
    hy_spread = get_high_yield_spread()
    yield_curve = get_yield_curve()
    fear_greed = get_fear_greed()
    buffett = get_buffett_indicator()
    vix = get_vix_index()
    fx = get_fx_data()
    
    theme_trends = get_theme_trends()
    sectors = get_sector_data()
    
    # 🚀 AI 뉴스 분석 실행
    ai_sentiment = get_ai_news_sentiment()
    
    risk_score = calculate_quant_risk_score(fear_greed, vix, yield_curve, sahm, hy_spread)
    now_kst = datetime.now(KST).isoformat(timespec="seconds")

    result = {
        "updated_at": now_kst,
        "quant_risk_score": risk_score, 
        "fear_greed": fear_greed,
        "buffett_indicator": buffett,
        "sahm_rule": sahm,
        "high_yield_spread": hy_spread,
        "yield_curve": yield_curve,
        "vix": vix,
        "fx": fx,
        "theme_trends": theme_trends,
        "sectors": sectors,
        "ai_sentiment": ai_sentiment, # 🚀 결과 JSON에 결합 (news_sources 포함)
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"\n✅ 퀀트 엔진 스케줄 연동 완료! 리스크 점수: {risk_score}점")


if __name__ == "__main__":
    main()