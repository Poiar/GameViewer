#!/bin/bash
# Scan staged changes for secrets before pushing
# Called from .husky/pre-push

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

# Get commits about to be pushed (if any)
REMOTE="$1"
URL="$2"

# Check all tracked files for hardcoded secrets
FILES=$(git ls-files | grep -v node_modules | grep -v '.git/')
SECRETS=0

while IFS= read -r file; do
  # Skip env files and lock files
  [[ "$file" == *".env" ]] && [[ "$file" != *".example"* ]] && continue
  [[ "$file" == *"package-lock"* ]] && continue
  [[ "$file" == *".png" ]] && continue
  [[ "$file" == *".jpg" ]] && continue

  # Only check if file exists
  [ ! -f "$file" ] && continue

  # Check for API key patterns
  if grep -qP '(?<!")(?:apiKey|api_key|apikey|secret|token|password)\s*[:=]\s*["\x27]?[a-zA-Z0-9_-]{16,}["\x27]?' "$file" 2>/dev/null; then
    # More careful check - look for actual assigned values
    if grep -qnP '(IGDB_CLIENT_ID|IGDB_ACCESS_TOKEN|SGDB_API_KEY|DATABASE_URL|JWT_SECRET)\s*=\s*[a-zA-Z0-9_-]{10,}' "$file" 2>/dev/null; then
      echo -e "${RED}SECRET FOUND in $file${NC}"
      grep -nP '(IGDB_CLIENT_ID|IGDB_ACCESS_TOKEN|SGDB_API_KEY|DATABASE_URL|JWT_SECRET)\s*=' "$file" | head -3
      SECRETS=1
    fi
  fi
done <<< "$FILES"

if [ $SECRETS -eq 1 ]; then
  echo -e "\n${RED}Push blocked: Secrets detected in tracked files.${NC}"
  echo "Move credentials to server/.env (gitignored) and reference via process.env"
  exit 1
fi

echo -e "${GREEN}✓ No secrets found${NC}"
exit 0
