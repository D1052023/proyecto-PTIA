from flask import Flask, render_template

app = Flask(__name__)

@app.route("/")
def login():
    return render_template("login.html")

@app.route("/register")
def register():
    return render_template("register.html")

@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")

@app.route("/forgotPassword")
def forgotPassword():
    return render_template("forgotPassword.html")

@app.route("/resetPassword")
def resetPassword():
    return render_template("resetPassword.html")

if __name__ == "__main__":
    app.run(debug=True)