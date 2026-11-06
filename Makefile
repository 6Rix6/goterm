BINARY := goterm
BUILD_DIR := build

.PHONY: all build web go clean run dev

all: build

build: web go

web:
	cd web && npm run build

go: web
	mkdir -p $(BUILD_DIR)
	go build -o $(BUILD_DIR)/$(BINARY) .

run: build
	./$(BUILD_DIR)/$(BINARY)

dev:
	@trap 'kill 0' INT TERM EXIT; \
	(cd web && npm run dev) & \
	air & \
	wait

clean:
	rm -rf web/dist $(BINARY)
