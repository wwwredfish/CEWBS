cd src
rm -rf ../dist
mkdir ../dist
browserify COOBS.js -o ../dist/COOBS.js
sed -i -e 's/var COOBS/var COOBS = window.COOBS/g' ../dist/COOBS.js
uglifyjs ../dist/COOBS.js -c -o ../dist/COOBS.min.js
cp COOBS.js ../dist/COOBS-commonjs.js
cp -rf meshers ../dist/meshers
