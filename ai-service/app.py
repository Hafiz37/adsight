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
    rpm = (reach / spend) * 1000 if spend > 0 else 0

    detail_ctr = (
        "CTR (Click-Through Rate) adalah persentase orang yang melihat iklan Anda dan kemudian mengkliknya. "
        "Ini adalah indikator seberapa relevan dan menarik iklan Anda bagi audiens. "
        "Semakin tinggi CTR, semakin efektif iklan Anda dalam menarik perhatian."
    )
    detail_roas = (
        "ROAS (Return on Ad Spend) adalah rasio pendapatan yang dihasilkan dibandingkan dengan biaya iklan. "
        "Ini mengukur efisiensi pengeluaran iklan Anda. "
        "ROAS di atas 4x dianggap sangat baik, sementara di bawah 2x menandakan perlu optimasi."
    )
    detail_rpm = (
        "RPM (Reach per 1000 Spend) mengukur efisiensi jangkauan iklan Anda. "
        "Semakin tinggi RPM, semakin banyak orang yang dapat Anda jangkau dengan setiap rupiah yang dibelanjakan. "
        "Ini dipengaruhi oleh pemilihan audiens, penempatan iklan, dan strategi bidding."
    )

    # --- CTR ---
    if ctr < 1:
        recommendations.append({
            "priority": "high",
            "category": "Creative",
            "metric": "CTR",
            "current_value": f"{ctr:.2f}%",
            "threshold": "> 3% (baik) / 1-3% (cukup)",
            "message": f"CTR Anda {ctr:.2f}% — sangat rendah. Ini berarti iklan Anda kurang menarik perhatian audiens.",
            "impact": "Rendahnya CTR menyebabkan biaya per klik (CPC) menjadi lebih mahal dan audiens yang menjangkau lebih sedikit karena algoritma Meta cenderung menampilkan iklan dengan engagement tinggi.",
            "action": "1. Ganti gambar atau video dengan visual yang lebih menarik dan relevan.\n2. Tulis ulang headline dan copy agar lebih persuasif dan spesifik.\n3. Tambahkan elemen urgensi seperti diskon terbatas atau countdown.\n4. Uji berbagai variasi kreatif (A/B test) untuk menemukan yang paling efektif.\n5. Pastikan Call-to-Action (CTA) jelas dan mendorong tindakan."
        })
    elif ctr < 2:
        recommendations.append({
            "priority": "medium",
            "category": "Creative",
            "metric": "CTR",
            "current_value": f"{ctr:.2f}%",
            "threshold": "> 3% (baik) / 1-3% (cukup)",
            "message": f"CTR Anda {ctr:.2f}% — cukup baik, tapi masih bisa ditingkatkan.",
            "impact": "CTR yang berada di kisaran rata-rata menandakan iklan Anda cukup relevan, namun ada ruang untuk optimasi agar performa lebih maksimal dan biaya iklan lebih efisien.",
            "action": "1. Variasikan copywriting dengan pendekatan manfaat (benefit-driven) bukan fitur (feature-driven).\n2. Gunakan social proof seperti testimoni atau jumlah pelanggan.\n3. Optimalkan CTA dengan kata-kata yang lebih spesifik dan mengundang tindakan.\n4. Coba format iklan berbeda seperti carousel, video pendek, atau collection ads.\n5. Lakukan A/B testing pada elemen headline secara rutin."
        })

    # --- ROAS ---
    if roas < 2:
        recommendations.append({
            "priority": "high",
            "category": "Budget & Audience",
            "metric": "ROAS",
            "current_value": f"{roas:.2f}x",
            "threshold": "> 4x (baik) / 2-4x (cukup)",
            "message": f"ROAS Anda {roas:.2f}x — di bawah 2x, artinya pengeluaran iklan belum efisien.",
            "impact": "ROAS rendah berarti Anda mengeluarkan lebih banyak biaya dibanding pendapatan yang dihasilkan. Ini dapat menggerus margin keuntungan dan membuat kampanye tidak berkelanjutan dalam jangka panjang.",
            "action": "1. Evaluasi ulang target audiens — persempit berdasarkan data demografis, minat, dan perilaku yang sudah terbukti konversi.\n2. Gunakan audiens lookalike dari data pelanggan existing (seed audience).\n3. Kurangi budget harian sementara dan alokasikan ke kampanye dengan performa terbaik.\n4. Optimalkan halaman landing page — pastikan relevan dengan iklan dan memiliki CTA yang jelas.\n5. Pastikan pixel Meta terpasang dengan benar dan melacak konversi secara akurat."
        })
    elif roas < 3:
        recommendations.append({
            "priority": "medium",
            "category": "Budget & Audience",
            "metric": "ROAS",
            "current_value": f"{roas:.2f}x",
            "threshold": "> 4x (baik) / 2-4x (cukup)",
            "message": f"ROAS Anda {roas:.2f}x — sudah cukup, namun belum optimal.",
            "impact": "ROAS di kisaran ini menandakan kampanye Anda hampir efisien. Dengan optimasi yang tepat, Anda bisa meningkatkan pendapatan tanpa menambah biaya iklan secara signifikan.",
            "action": "1. Persempit target audiens berdasarkan data konversi — fokus pada segmen dengan ROAS tertinggi.\n2. Buat audiens lookalike dari data pelanggan dengan nilai pembelian tinggi (high LTV).\n3. Coba retargeting untuk pengunjung website yang belum melakukan konversi.\n4. Optimasi jadwal penayangan iklan pada jam-jam dengan konversi tertinggi.\n5. Evaluasi penawaran (offer) — apakah diskon, bundle, atau free shipping bisa meningkatkan konversi?"
        })

    # --- Reach vs Spend ---
    if spend > 0:
        if rpm < 100:
            recommendations.append({
                "priority": "high",
                "category": "Distribution",
                "metric": "RPM",
                "current_value": f"{rpm:.0f}",
                "threshold": "> 500 (baik) / 100-500 (cukup)",
                "message": f"RPM Anda {rpm:.0f} — jangkauan sangat rendah dibandingkan budget yang dikeluarkan.",
                "impact": "RPM rendah berarti Anda membayar lebih mahal untuk setiap orang yang terjangkau. Ini bisa disebabkan oleh audiens yang terlalu sempit, penempatan iklan yang tidak optimal, atau strategi bidding yang kurang tepat.",
                "action": "1. Perluas target audiens — tambahkan minat terkait, perluas rentang usia, atau buka ke lokasi yang lebih luas.\n2. Gunakan Advantage+ Placements (otomatis) agar Meta dapat menempatkan iklan di posisi dengan biaya terendah.\n3. Pertimbangkan strategi bidding Lowest Cost tanpa batas atas untuk memaksimalkan jangkauan.\n4. Refresh kreatif secara berkala untuk mencegah audience fatigue.\n5. Coba Campaign Type 'Reach' jika tujuan utama Anda adalah brand awareness."
            })
        elif rpm < 300:
            recommendations.append({
                "priority": "medium",
                "category": "Distribution",
                "metric": "RPM",
                "current_value": f"{rpm:.0f}",
                "threshold": "> 500 (baik) / 100-500 (cukup)",
                "message": f"RPM Anda {rpm:.0f} — jangkauan cukup, namun masih bisa ditingkatkan.",
                "impact": "Efisiensi jangkauan Anda saat ini berada di tingkat menengah. Dengan optimasi distribusi, Anda bisa menjangkau lebih banyak orang dengan budget yang sama.",
                "action": "1. Gunakan Advantage+ Placements untuk mengoptimasi penempatan iklan secara otomatis.\n2. Tambahan variasi kreatif untuk menghindari audience fatigue.\n3. Coba perbesar minor adjustments pada target audiens.\n4. Manfaatkan fitur Dynamic Creative untuk menguji berbagai kombinasi secara otomatis.\n5. Pantau frequency — jika di atas 3-4, refresh kreatif atau perluas audiens."
            })

    # --- Skor keseluruhan ---
    if score >= 80:
        recommendations.append({
            "priority": "low",
            "category": "Scaling",
            "metric": "Skor Keseluruhan",
            "current_value": f"{score}/100",
            "threshold": "> 80 (sangat baik)",
            "message": "Performa kampanye Anda sangat baik! Sekarang saatnya melakukan scaling.",
            "impact": "Dengan skor di atas 80, kampanye Anda telah menunjukkan performa yang solid di semua metrik utama. Ini adalah momentum yang tepat untuk memperluas jangkauan dan meningkatkan pendapatan secara agresif.",
            "action": "1. Naikkan budget harian secara bertahap 10-20% per hari — pantau selama 3 hari sebelum menaikkan lagi.\n2. Buat kampanye terpisah dengan audiens lookalike dari data konversi existing.\n3. Ekspansi ke lokasi atau negara baru yang masih satu region.\n4. Manfaatkan fitur Campaign Budget Optimization (CBO) untuk alokasi budget otomatis.\n5. Tambahkan produk atau layanan baru ke dalam campaign untuk cross-selling."
        })
    elif score >= 60:
        recommendations.append({
            "priority": "low",
            "category": "Optimization",
            "metric": "Skor Keseluruhan",
            "current_value": f"{score}/100",
            "threshold": "> 80 (sangat baik) / 60-79 (cukup)",
            "message": "Performa kampanye di atas rata-rata. Beberapa optimasi dapat mendorong hasil lebih baik.",
            "impact": "Skor Anda menunjukkan bahwa kampanye sudah berjalan cukup baik, namun masih ada metrik yang bisa ditingkatkan. Dengan optimasi yang tepat, Anda bisa mencapai performa excellent.",
            "action": "1. Lakukan A/B testing pada berbagai elemen iklan — kreatif, headline, CTA, dan audiens.\n2. Analisis data demografis dan waktu untuk menemukan segmen dengan performa terbaik.\n3. Optimasi landing page untuk meningkatkan conversion rate.\n4. Coba strategi retargeting untuk pengunjung yang belum konversi.\n5. Evaluasi frekuensi iklan — jika terlalu tinggi, refresh kreatif atau perluas audiens."
        })

    # Edge case
    if not recommendations:
        recommendations.append({
            "priority": "low",
            "category": "General",
            "metric": "-",
            "current_value": "-",
            "threshold": "-",
            "message": "Tidak ada rekomendasi khusus saat ini. Pantau performa iklan secara berkala.",
            "impact": "Semua metrik kampanye Anda berada dalam kondisi yang stabil.",
            "action": "1. Pantau performa iklan secara rutin (minimal 3x seminggu).\n2. Catat tren perubahan metrik dari waktu ke waktu.\n3. Siapkan cadangan kreatif untuk rotasi.\n4. Review kompetitor dan tren industri untuk tetap relevan."
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



