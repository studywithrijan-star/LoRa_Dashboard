from flask import Flask, jsonify, render_template
import requests, csv, io

app = Flask(__name__)

# -------------------------
# Google Sheet CSV URLs
# -------------------------
SHEET_URL_NODE1 = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQdE_ypjaSCAc58yEAkoGoCG12jR7h2aSh-MB1SQiOXZuo-NpS-VB28hvDVTPXa_lUJb1KoJxHRUNSy/pub?gid=0&single=true&output=csv"
SHEET_URL_NODE2 = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQdE_ypjaSCAc58yEAkoGoCG12jR7h2aSh-MB1SQiOXZuo-NpS-VB28hvDVTPXa_lUJb1KoJxHRUNSy/pub?gid=1418193114&single=true&output=csv"
SHEET_URL_NODE3 = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQdE_ypjaSCAc58yEAkoGoCG12jR7h2aSh-MB1SQiOXZuo-NpS-VB28hvDVTPXa_lUJb1KoJxHRUNSy/pub?gid=210587079&single=true&output=csv"

# -------------------------
# Function to fetch CSV and parse
# -------------------------
def fetch_csv(url):
    response = requests.get(url)
    content = response.content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(content))
    data = list(reader)
    # Convert numeric values
    for row in data:
        for key in row:
            try:
                row[key] = float(row[key])
            except:
                pass
    return data

# -------------------------
# API routes
# -------------------------
@app.route("/api/node1")
def node1_data():
    try:
        return jsonify(fetch_csv(SHEET_URL_NODE1))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/node2")
def node2_data():
    try:
        return jsonify(fetch_csv(SHEET_URL_NODE2))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/node3")
def node3_data():
    try:
        return jsonify(fetch_csv(SHEET_URL_NODE3))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# -------------------------
# Frontend routes
# -------------------------
@app.route("/")
def home():
    return render_template("index.html")

@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")

@app.route("/history")
def history():
    return render_template("history.html")  # New route for History page

@app.route("/analysis")
def analysis():
    return render_template("analysis.html")  # New route for Analysis page

# -------------------------
if __name__ == "__main__":
    app.run(debug=True)
