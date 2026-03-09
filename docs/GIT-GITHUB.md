# Connect Vsparkz to GitHub

Steps to put your project on GitHub and push your code.

---

## 1. Create a GitHub repository

1. Go to [github.com](https://github.com) and sign in.
2. Click **+** (top right) → **New repository**.
3. **Repository name:** e.g. `vsparkz` or `vsparkz-digital`.
4. **Description:** optional (e.g. "Vsparkz Digital – agency platform").
5. Choose **Public** (or Private).
6. **Do not** check "Add a README" or "Add .gitignore" (you already have them).
7. Click **Create repository**.

GitHub will show a page with commands. You’ll use the **remote URL** (e.g. `https://github.com/YOUR_USERNAME/vsparkz.git` or `git@github.com:YOUR_USERNAME/vsparkz.git`).

---

## 2. Open terminal in the project folder

```bash
cd C:\wamp64\www\vsparkz
```

(Or open the project in VS Code / Cursor and use the integrated terminal.)

---

## 3. Initialize Git (if not already)

Check if Git is already set up:

```bash
git status
```

- If you see **"not a git repository"**, run:

```bash
git init
```

- If you see branch and file list, Git is already initialized; skip to step 4.

---

## 4. Add the GitHub remote

Replace `YOUR_USERNAME` and `vsparkz` with your GitHub username and repo name.

**HTTPS (easier, uses browser login):**

```bash
git remote add origin https://github.com/YOUR_USERNAME/vsparkz.git
```

**SSH (if you use SSH keys):**

```bash
git remote add origin git@github.com:YOUR_USERNAME/vsparkz.git
```

Check:

```bash
git remote -v
```

You should see `origin` pointing to your GitHub URL.

---

## 5. Stage and commit your code

```bash
git add .
git status
```

Review the list. You should **not** see:

- `backend/.env`
- `node_modules/`
- `backend/vendor/`

(They are in `.gitignore`.)

Then commit:

```bash
git commit -m "Initial commit: Vsparkz Digital platform (Laravel + React admin + website)"
```

---

## 6. Push to GitHub

**If this is the first push:**

```bash
git branch -M main
git push -u origin main
```

**If the repo already had a first commit and you pulled first:**

```bash
git pull origin main --rebase
git push -u origin main
```

When prompted:

- **HTTPS:** sign in with your GitHub account (browser or token).
- **SSH:** use your SSH key passphrase if set.

---

## 7. Verify

Open your repo on GitHub in the browser. You should see:

- `backend/`, `admin/`, `website/`, `docs/`, `README.md`, `.gitignore`, etc.
- No `node_modules`, no `backend/vendor`, no `.env` files.

---

## Summary

| Step | Command |
|------|--------|
| 1 | Create repo on GitHub (no README / .gitignore) |
| 2 | `cd C:\wamp64\www\vsparkz` |
| 3 | `git init` (if needed) |
| 4 | `git remote add origin https://github.com/YOUR_USERNAME/vsparkz.git` |
| 5 | `git add .` → `git commit -m "Initial commit"` |
| 6 | `git branch -M main` → `git push -u origin main` |

---

## After the first push

- **Clone on another PC:**  
  `git clone https://github.com/YOUR_USERNAME/vsparkz.git` then run setup (see [docs/DOCUMENTATION.md](DOCUMENTATION.md)).
- **Ignore .env:** Never commit `backend/.env` (secrets). Use `backend/.env.example` as a template and copy to `.env` locally.
- **Future changes:**  
  `git add .` → `git commit -m "Your message"` → `git push`
