package web

import "embed"

//go:embed dist dist/**
var Assets embed.FS
