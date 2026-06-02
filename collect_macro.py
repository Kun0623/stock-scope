import json
import re
import sys
import time
from datetime import datetime, timezone, timedelta

import requests
from bs4 import BeautifulSoup
import yfinance as yf

FRED_API_KEY = "***REMOVED***"
FRED_BASE = "https://api.stlouisfed.org/fred/series/observations"
OUTPUT_FILE = "public/macro_status.json"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
}

KST = timezone(timedelta(hours=9))


def fetch_fred(series_id: str) -> float:
    time.sleep(1) # 👈 연준 서버가 화내지 않도록 요청 전에 1초씩 멈춰줍니다
    
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
            
    raise ValueError(f"{series_id} 지표의 유효한 데이터를 찾을 수 없습니다.")


def get_sahm_rule() -> dict:
    try:
        value = fetch_fred("SAHMCURRENT")
        status = "Recession Signal" if value >= 0.5 else "Elevated" if value >= 0.3 else "Normal"
        return {"value": round(value, 2), "status": status}
    except Exception as e:
        print(f"[WARN] Sahm Rule fetch failed: {e}", file=sys.stderr)
        return {"value": None, "status": "Unavailable"}


def get_high_yield_spread() -> dict:
    try:
        value = fetch_fred("BAMLH0A0HYM2")
        status = "High Risk" if value >= 6.0 else "Elevated" if value >= 4.5 else "Normal"
        return {"value": round(value, 2), "status": status}
    except Exception as e:
        print(f"[WARN] High Yield Spread fetch failed: {e}", file=sys.stderr)
        return {"value": None, "status": "Unavailable"}


# 🚀 [추가 지표 1] 장단기 금리차 (10년물 - 2년물)
def get_yield_curve() -> dict:
    try:
        value = fetch_fred("T10Y2Y")
        status = "Inverted (Recession Risk)" if value < 0 else "Normal"
        return {"value": round(value, 2), "status": status}
    except Exception as e:
        print(f"[WARN] Yield Curve fetch failed: {e}", file=sys.stderr)
        return {"value": None, "status": "Unavailable"}


def get_fear_greed() -> dict:
    urls = [
        "https://production.dataviz.cnn.io/index/fearandgreed/graphdata",
        "https://edition.cnn.com/markets/fear-and-greed",
    ]
    try:
        resp = requests.get(urls[0], headers=HEADERS, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        score = data.get("fear_and_greed", {}).get("score")
        if score is not None:
            value = round(float(score))
            return {"value": value, "status": _fear_greed_label(value)}
    except Exception as e:
        print(f"[INFO] CNN JSON API failed, trying HTML: {e}", file=sys.stderr)

    try:
        resp = requests.get(urls[1], headers=HEADERS, timeout=20)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        scripts = soup.find_all("script")
        for script in scripts:
            text = script.string or ""
            match = re.search(r'"score"\s*:\s*(\d+(?:\.\d+)?)', text)
            if match:
                value = round(float(match.group(1)))
                return {"value": value, "status": _fear_greed_label(value)}
    except Exception as e:
        print(f"[WARN] Fear & Greed HTML scrape failed: {e}", file=sys.stderr)

    return {"value": None, "status": "Unavailable"}


def _fear_greed_label(value: int) -> str:
    if value >= 75: return "Extreme Greed"
    elif value >= 55: return "Greed"
    elif value >= 45: return "Neutral"
    elif value >= 25: return "Fear"
    else: return "Extreme Fear"


def get_buffett_indicator() -> dict:
    try:
        w5000 = yf.Ticker("^W5000")
        hist = w5000.history(period="5d")
        if hist.empty: raise ValueError("Wilshire 5000 데이터 공백")
        latest_w5000 = float(hist['Close'].iloc[-1])
        gdp = fetch_fred("GDP")
        
        if latest_w5000 and gdp:
            ratio = (latest_w5000 / gdp) * 100
            value = round(ratio, 1)
            return {"value": value, "status": _buffett_label(value)}
    except Exception as e:
        print(f"[WARN] Buffett Indicator 하이브리드 계산 실패: {e}", file=sys.stderr)
    return {"value": None, "status": "Unavailable"}


def _buffett_label(value: float) -> str:
    if value >= 180: return "Strongly Overvalued"
    elif value >= 140: return "Overvalued"
    elif value >= 100: return "Fairly Valued"
    elif value >= 70: return "Undervalued"
    else: return "Strongly Undervalued"


# 🚀 [추가 지표 2] VIX 지수 (공포 지수)
def get_vix_index() -> dict:
    try:
        vix = yf.Ticker("^VIX")
        hist = vix.history(period="2d")
        if not hist.empty:
            value = float(hist['Close'].iloc[-1])
            status = "Panic" if value >= 30 else "Spike" if value >= 20 else "Stable"
            return {"value": round(value, 2), "status": status}
    except Exception as e:
        print(f"[WARN] VIX 수집 실패: {e}", file=sys.stderr)
    return {"value": None, "status": "Unavailable"}


# 🚀 [추가 지표 3] 외환 데이터 (달러 인덱스 및 원달러 환율)
def get_fx_data() -> dict:
    try:
        # 달러인덱스 수집
        dxy_hist = yf.Ticker("DX-Y.NYB").history(period="2d")
        dxy_val = round(float(dxy_hist['Close'].iloc[-1]), 2) if not dxy_hist.empty else None

        # 원/달러 환율 수집
        usdkrw_hist = yf.Ticker("KRW=X").history(period="2d")
        usdkrw_val = round(float(usdkrw_hist['Close'].iloc[-1]), 1) if not usdkrw_hist.empty else None

        return {"dxy": dxy_val, "usd_krw": usdkrw_val, "status": "Normal"}
    except Exception as e:
        print(f"[WARN] 외환 데이터 수집 실패: {e}", file=sys.stderr)
    return {"dxy": None, "usd_krw": None, "status": "Unavailable"}


def get_sector_data() -> list:
    # S&P 500 11개 공식 섹터 + 반도체(SMH) 추가
    sectors = {
        "XLK": "기술 (Tech)", 
        "XLF": "금융 (Financials)",
        "XLV": "헬스케어 (Health Care)", 
        "XLE": "에너지 (Energy)",
        "XLY": "임의소비재 (Discretionary)", 
        "XLP": "필수소비재 (Staples)",
        "XLI": "산업재 (Industrials)", 
        "XLB": "소재 (Materials)",
        "XLRE": "부동산 (Real Estate)", 
        "XLU": "유틸리티 (Utilities)",
        "XLC": "통신 (Communication)",
        "SMH": "반도체 (Semiconductors)" # 시장 주도 섹터 별도 추가
    }
    results = []
    print("🌍 글로벌 주도 상세 섹터 수집 시작...")
    for ticker, name in sectors.items():
        try:
            hist = yf.Ticker(ticker).history(period="2d")
            if not hist.empty and len(hist) >= 1:
                curr_price = float(hist['Close'].iloc[-1])
                prev_price = float(hist['Close'].iloc[-2]) if len(hist) > 1 else curr_price
                change_pct = ((curr_price - prev_price) / prev_price) * 100
                results.append({"ticker": ticker, "name": name, "change_pct": round(change_pct, 2)})
        except Exception as e:
            print(f"    [오류] {ticker} 수집 실패: {e}")
            
    # 등락률이 높은 순서대로(내림차순) 정렬
    results.sort(key=lambda x: x["change_pct"], reverse=True)
    return results


def main():
    print("📡 안안(AnAn) 통합 매크로 파이프라인 가동...\n")
    sahm = get_sahm_rule()
    hy_spread = get_high_yield_spread()
    yield_curve = get_yield_curve()  # 추가 1
    fear_greed = get_fear_greed()
    buffett = get_buffett_indicator()
    vix = get_vix_index()            # 추가 2
    fx = get_fx_data()               # 추가 3
    sectors = get_sector_data()

    now_kst = datetime.now(KST).isoformat(timespec="seconds")

    result = {
        "updated_at": now_kst,
        "fear_greed": fear_greed,
        "buffett_indicator": buffett,
        "sahm_rule": sahm,
        "high_yield_spread": hy_spread,
        "yield_curve": yield_curve,
        "vix": vix,
        "fx": fx,
        "sectors": sectors,
    }

    output = json.dumps(result, ensure_ascii=False, indent=2)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(output)
    print(f"\n✅ 데이터 굽기 전량 완료! 소스: {OUTPUT_FILE} ({now_kst})")


if __name__ == "__main__":
    main()