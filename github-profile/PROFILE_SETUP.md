# GitHub profile setup

The public profile repository does not exist yet. Create a public repository named exactly:

```text
neelmu12-code/neelmu12-code
```

Copy `README.md` and the `assets` folder from this directory to the repository root. GitHub will then render the README on the account profile automatically.

## Recommended profile fields

**Name**

```text
Neel Upadhyay
```

**Bio**

```text
Software Engineering @ York | Backend, cloud & cybersecurity | Java, Python, AWS, Spring Boot | Security+ · AWS Cloud Practitioner
```

**Location**

```text
Ontario, Canada
```

**Website**

```text
https://neelupadhyay.ca/
```

**Social link**

```text
https://www.linkedin.com/in/neel-upadhyay-a458b3264/
```

## Publish with Git

After creating the empty public repository on GitHub:

```powershell
git clone https://github.com/neelmu12-code/neelmu12-code.git
Copy-Item -Recurse .\github-profile\* .\neelmu12-code\
Set-Location .\neelmu12-code
git add README.md assets
git commit -m "Create professional GitHub profile"
git push origin main
```
