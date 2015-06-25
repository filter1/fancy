import json
import itertools

data = json.loads(open('app/public/data/lattice.json').read())

x = []

for node in data["lattice"]:
	names = node["intensionNames"]
	# if len(names) == 1:
	# 	x.append(names[0])

	if 0 < len(names) < 5:
		for p in itertools.permutations(names):
			x.append(p)

x.sort()
x.sort(key=len)

x = [ ' '.join(l) for l in x ]
with open('app/public/data/suggestions.json', 'w') as outfile:
    json.dump(x, outfile)