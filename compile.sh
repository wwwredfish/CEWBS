cd src
rm -rf ../dist
mkdir ../dist
browserify CEWBS.js -o ../dist/CEWBS.js
sed -i -e 's/var CEWBS/var CEWBS = window.CEWBS/g' ../dist/CEWBS.js
uglifyjs ../dist/CEWBS.js -c -o ../dist/CEWBS.min.js
cp CEWBS.js ../dist/CEWBS-commonjs.js
cp -rf meshers ../dist/meshers
