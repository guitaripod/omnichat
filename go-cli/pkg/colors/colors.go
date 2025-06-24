package colors

import "fmt"

// ANSI color codes
const (
	Reset  = "\033[0m"
	Red    = "\033[31m"
	Green  = "\033[32m"
	Yellow = "\033[33m"
	Blue   = "\033[34m"
	Purple = "\033[35m"
	Cyan   = "\033[36m"
	White  = "\033[37m"
	Bold   = "\033[1m"
)

// Colorize wraps text with ANSI color codes
func Colorize(color, text string) string {
	return fmt.Sprintf("%s%s%s", color, text, Reset)
}

// Success returns green colored text
func Success(text string) string {
	return Colorize(Green, text)
}

// Error returns red colored text
func Error(text string) string {
	return Colorize(Red, text)
}

// Warning returns yellow colored text
func Warning(text string) string {
	return Colorize(Yellow, text)
}

// Info returns cyan colored text
func Info(text string) string {
	return Colorize(Cyan, text)
}

// Bold returns bold text
func BoldText(text string) string {
	return fmt.Sprintf("%s%s%s", Bold, text, Reset)
}

// Header returns a formatted header
func Header(emoji, text string) string {
	return fmt.Sprintf("%s %s", emoji, BoldText(text))
}