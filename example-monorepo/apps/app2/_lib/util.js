export const mixed = string => (string || '')
	.split('')
	.map((char, index) => index % 2 ? char.toUpperCase() : char.toLowerCase())
	.join('')
