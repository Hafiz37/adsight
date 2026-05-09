# Port  : 5001

from flask import Flask, request, jsonify
app = Flask(__name__)



# FUNGSI HELPER: Hitung skor per metrik (0-100)
def score_ctr(ctr):
    # CTR dalam persen
    # < 1%  -> buruk  -> 0-30
    # 1-3%  -> cukup  -> 31-60
    # > 3%  -> bagus  -> 61-100
    if ctr < 1:
        return round((ctr / 1) * 30)
    elif ctr <= 3:
        return round(31 + ((ctr - 1) / (3 - 1)) * (60 - 31))
    else:
        return min(100, round(61 + ((ctr - 3) / (10 - 3)) * (100 - 61)))


def score_roas(roas):
    # < 2   -> buruk  -> 0-30
    # 2-4   -> cukup  -> 31-60
    # > 4   -> bagus  -> 61-100
    if roas < 2:
        return round((roas / 2) * 30)
    elif roas <= 4:
        return round(31 + ((roas - 2) / (4 - 2)) * (60 - 31))
    else:
        return min(100, round(61 + ((roas - 4) / (10 - 4)) * (100 - 61)))


def score_reach(reach, spend):
    # Reach per 1000 spend (RPM)
    # < 100   -> buruk  -> 0-30
    # 100-500 -> cukup  -> 31-60
    # > 500   -> bagus  -> 61-100
    if spend <= 0:
        return 0
    rpm = (reach / spend) * 1000
    if rpm < 100:
        return round((rpm / 100) * 30)
    elif rpm <= 500:
        return round(31 + ((rpm - 100) / (500 - 100)) * (60 - 31))
    else:
        return min(100, round(61 + ((rpm - 500) / (2000 - 500)) * (100 - 61)))







# FUNGSI UTAMA: Hitung skor gabungan (weighted average)
def calculate_score(ctr, roas, reach, spend):
    # Bobot: CTR 40% + ROAS 40% + Reach 20%
    s_ctr   = score_ctr(ctr)
    s_roas  = score_roas(roas)
    s_reach = score_reach(reach, spend)

    total = (s_ctr * 0.40) + (s_roas * 0.40) + (s_reach * 0.20)
    final_score = round(total)

    breakdown = {
        "ctr_score"  : s_ctr,
        "roas_score" : s_roas,
        "reach_score": s_reach,
    }

    return final_score, breakdown






# FUNGSI: Generate rekomendasi berdasarkan metrik
def generate_recommendations(score, ctr, roas, spend, reach):
    recommendations = []

    # --- CTR ---
    if ctr < 1:
        recommendations.append({
            "priority": "high",
            "category": "Creative",
            "message": "CTR Anda di bawah 1% - ganti gambar atau video iklan dengan konten yang lebih menarik perhatian."
        })
    elif ctr < 2:
        recommendations.append({
            "priority": "medium",
            "category": "Creative",
            "message": "CTR Anda cukup baik tapi masih bisa ditingkatkan - coba variasikan copywriting atau call-to-action."
        })

    # --- ROAS ---
    if roas < 2:
        recommendations.append({
            "priority": "high",
            "category": "Budget & Audience",
            "message": "ROAS di bawah 2 - kurangi budget harian atau ubah target audiens agar lebih relevan."
        })
    elif roas < 3:
        recommendations.append({
            "priority": "medium",
            "category": "Budget & Audience",
            "message": "ROAS belum optimal - pertimbangkan mempersempit target audiens berdasarkan interest atau lookalike."
        })

    # --- Reach vs Spend ---
    if spend > 0:
        rpm = (reach / spend) * 1000
        if rpm < 100:
            recommendations.append({
                "priority": "high",
                "category": "Distribution",
                "message": "Jangkauan sangat rendah dibanding budget - perluas target lokasi atau perbesar ukuran audiens."
            })
        elif rpm < 300:
            recommendations.append({
                "priority": "medium",
                "category": "Distribution",
                "message": "Jangkauan masih bisa ditingkatkan - coba gunakan Advantage+ Placements di Meta Ads Manager."
            })

    # --- Skor keseluruhan ---
    if score >= 80:
        recommendations.append({
            "priority": "low",
            "category": "Scaling",
            "message": "Performa sangat baik! Pertimbangkan menaikkan budget 10-20% per hari untuk memperluas jangkauan."
        })
    elif score >= 60:
        recommendations.append({
            "priority": "low",
            "category": "Optimization",
            "message": "Performa di atas rata-rata - lakukan A/B testing pada elemen iklan untuk hasil lebih optimal."
        })

    # Edge case
    if not recommendations:
        recommendations.append({
            "priority": "low",
            "category": "General",
            "message": "Tidak ada rekomendasi khusus saat ini. Pantau performa iklan secara berkala."
        })

    # Urutkan: high -> medium -> low
    priority_order = {"high": 0, "medium": 1, "low": 2}
    recommendations.sort(key=lambda x: priority_order.get(x["priority"], 3))

    return recommendations








# FUNGSI HELPER: Label & warna berdasarkan skor
def get_score_label(score):
    # 0-39   -> Buruk  -> merah
    # 40-69  -> Cukup  -> kuning
    # 70-100 -> Bagus  -> hijau
    if score < 40:
        return {"label": "Buruk", "color": "red"}
    elif score < 70:
        return {"label": "Cukup", "color": "yellow"}
    else:
        return {"label": "Bagus", "color": "green"}








# ENDPOINT: POST /analyze
@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()

    if not data:
        return jsonify({"error": "Request body harus berupa JSON."}), 400

    required_fields = ['ctr', 'roas', 'reach', 'spend']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Field '{field}' wajib diisi."}), 400

    try:
        ctr   = float(data['ctr'])
        roas  = float(data['roas'])
        reach = float(data['reach'])
        spend = float(data['spend'])
    except (ValueError, TypeError):
        return jsonify({"error": "Semua field harus berupa angka."}), 400

    if any(v < 0 for v in [ctr, roas, reach, spend]):
        return jsonify({"error": "Nilai metrik tidak boleh negatif."}), 400

    score, breakdown = calculate_score(ctr, roas, reach, spend)
    recommendations  = generate_recommendations(score, ctr, roas, spend, reach)
    score_info       = get_score_label(score)

    return jsonify({
        "score"          : score,
        "label"          : score_info["label"],
        "color"          : score_info["color"],
        "breakdown"      : breakdown,
        "recommendations": recommendations
    }), 200







# ENDPOINT: GET /health
@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "service": "AdSight AI Engine"}), 200


# RUN SERVER
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)



