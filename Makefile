\t := $$'\t'
\n := $$'\n'
ob := (

targets   := index.js browser.js
node-only := $(shell grep -irwF lib -e 'require$(ob)' | cut -d : -f 1 | uniq)
browser   := $(filter-out $(node-only),$(wildcard lib/*.js))

all: $(targets)

# Generate a compiled suite of functions from lib/*.js. Assumes Node environment.
index.js: $(wildcard lib/*.js) $(wildcard lib/classes/*.js)
	@echo '"use strict";' > $@
	@cat $^ | sed -Ee '/"use strict";$$/d' >> $@
	@printf $(\n)"module.exports = {"$(\n) >> $@
	@perl -0777 -ne 'print "$$&\n" while /^(?:function|class)\s+\K(\w+)/gm' $^ \
	| sort --ignore-case \
	| sed -e 's/^/\t/g; s/$$/,/g;' >> $@;
	@printf "};"$(\n) >> $@; \
	echo $(\n)"// Generate non-breaking fs functions" >> $@; \
	echo "Object.assign(module.exports, {"            >> $@; \
	echo $(\t)"lstat:     nerf(fs.lstatSync),"        >> $@; \
	echo $(\t)"realpath:  nerf(fs.realpathSync),"     >> $@; \
	echo "});" >> $@

# Generate browser-compatible version of function suite
browser.js: $(browser)
	@echo '"use strict";' > $@
	@cat $^ | sed -Ee '/"use strict";$$/d' >> $@


# Run tests
test: test-node test-atom

test-node:
	@mocha test

test-atom:
	@atom -t test


# Delete all generated targets
clean:
	@rm -f $(targets)

.PHONY: clean test test-node test-atom
