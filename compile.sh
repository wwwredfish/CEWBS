cd src

#Prepare directories
rm -rf ../dist
mkdir ../dist

##BROWSERIFY##
#Build browserified edition with the version number
browserify CEWBS.js -o ../dist/CEWBS-$1-debug.js

#Set browserified debug edition's global variable
sed -i -e 's/var CEWBS/var CEWBS = window.CEWBS/g' ../dist/CEWBS-$1-debug.js
#Set browserified edition's version
sed -i -e "s/%VERSION%/$1/g" ../dist/CEWBS-$1-debug.js

#Build browserified, minified verison
uglifyjs ../dist/CEWBS-$1-debug.js -c -o ../dist/CEWBS-$1.js

##COMMONJS##
#Copy and set version number for CommonJS edition
cp CEWBS.js ../dist/CEWBS-$1-commonjs.js
sed -i -e "s/%VERSION%/$1/g" ../dist/CEWBS-$1-commonjs.js

#Copy meshers folder for CommonJS edition
cp -rf meshers ../dist/meshers

##FINALISE##
#Finally copy new version to examples folder.
cp ../dist/CEWBS-$1.js ../examples/lib/CEWBS.js

