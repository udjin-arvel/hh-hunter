.PHONY: help install dev build zip typecheck lint test check clean

help:
	@echo HH-Hunter targets:
	@echo   make install     - install dependencies (npm ci)
	@echo   make dev         - start WXT dev server
	@echo   make build       - production Chrome MV3 build
	@echo   make zip         - create Chrome Web Store ZIP
	@echo   make typecheck   - run TypeScript check
	@echo   make lint        - run ESLint
	@echo   make test        - run Vitest
	@echo   make check       - typecheck + lint + test + build
	@echo   make clean       - remove build output and cache

install:
	npm ci

dev:
	npm run dev

build:
	npm run build

zip:
	npm run zip

typecheck:
	npm run typecheck

lint:
	npm run lint

test:
	npm run test

check: typecheck lint test build

clean:
	npx rimraf .output node_modules/.cache .wxt/tsconfig.tsbuildinfo
