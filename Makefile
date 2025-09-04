SHELL := bash

.PHONY: install lint format

install:
	@npm $@

lint:
	@npm run $@

format:
	@npm run $@
