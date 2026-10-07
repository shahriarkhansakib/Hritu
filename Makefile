.PHONY: cache demo test tiles mcp clean

cache:
	@echo "Pre-fetching all NASA datasets into cache/ and demo_fixtures/..."
	python -m src.acquire.power
	python -m src.acquire.imerg
	python -m src.acquire.modis
	python -m src.acquire.viirs
	python -m src.acquire.tiles
	@echo "Done. Run 'make demo' to test offline mode."

demo:
	@echo "Starting Hritu in OFFLINE=1 mode..."
	OFFLINE=1 uvicorn src.api.main:app --reload --port 8000

test:
	@echo "Running unit tests and cite_check validation..."
	pytest src/compute/tests/ -v

tiles:
	@echo "Generating PMTiles for offline map..."
	python src/acquire/tiles.py \
		--layer MODIS_Terra_CorrectedReflectance_TrueColor \
		--bbox 88.0,20.6,92.7,26.6 \
		--zoom 4-10 \
		--date 2024-06-15 \
		--out cache/tiles/

mcp:
	@echo "Starting NASA Tools MCP server..."
	python nasa_tools_mcp.py

clean:
	rm -rf cache/ __pycache__/ .pytest_cache/
