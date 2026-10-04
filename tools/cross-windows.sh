#!/bin/sh
set -eu

CROSS=x86_64-w64-mingw32
ROOT="$(pwd)"
PREFIX="$ROOT/inst-win64"
BUILD_PREFIX="$ROOT/inst-native"
SRC="$ROOT/ns-src-win64"
JOBS="$(getconf _NPROCESSORS_ONLN 2>/dev/null || echo 2)"

export HOST="$CROSS"
export PREFIX
export GCCSDK_INSTALL_ENV="$PREFIX"
export PKG_CONFIG_PATH="$PREFIX/lib/pkgconfig"
export PKG_CONFIG_LIBDIR="$PREFIX/lib/pkgconfig"
export PATH="$BUILD_PREFIX/bin:$PATH"

mkdir -p "$PREFIX" "$BUILD_PREFIX" "$SRC"

fetch() {
    dir="$1"
    url="$2"
    if [ ! -d "$SRC/$dir" ]; then
        wget -q -O "$SRC/$dir.archive" "$url"
        tar -C "$SRC" -xf "$SRC/$dir.archive"
        rm -f "$SRC/$dir.archive"
    fi
}

clone() {
    repo="$1"
    if [ ! -d "$SRC/$repo" ]; then
        git clone --depth 1 "https://github.com/netsurf-browser/$repo.git" "$SRC/$repo"
    fi
}

host_tool() {
    clone "$1"
    make -C "$SRC/$1" -j"$JOBS" install PREFIX="$BUILD_PREFIX" HOST="$(cc -dumpmachine)"
}

cross_lib() {
    clone "$1"
    make -C "$SRC/$1" -j"$JOBS" install PREFIX="$PREFIX" HOST="$CROSS" \
        CC="$CROSS-gcc" CXX="$CROSS-g++" AR="$CROSS-ar" RANLIB="$CROSS-ranlib" \
        STRIP="$CROSS-strip" WARNFLAGS="-Wall"
}

host_tool buildsystem
make -C "$SRC/buildsystem" install PREFIX="$PREFIX"
clone nsgenbind
host_tool nsgenbind

cross_lib libwapcaplet
cross_lib libparserutils
cross_lib libnslog
cross_lib libnspsl
cross_lib libnsutils
cross_lib libhubbub
cross_lib libcss
cross_lib libdom
cross_lib libnsgif
cross_lib libnsbmp

clone utf8proc
make -C "$SRC/utf8proc" -j"$JOBS" CC="$CROSS-gcc" AR="$CROSS-ar" libutf8proc.a
cp "$SRC/utf8proc/libutf8proc.a" "$PREFIX/lib/"
cp "$SRC/utf8proc/utf8proc.h" "$PREFIX/include/"
mkdir -p "$PREFIX/lib/pkgconfig"
printf 'prefix=%s\nlibdir=${prefix}/lib\nincludedir=${prefix}/include\n\nName: libutf8proc\nDescription: UTF-8 text processing library\nVersion: 2.12.0\nLibs: -L${libdir} -lutf8proc\nCflags: -I${includedir}\n' "$PREFIX" > "$PREFIX/lib/pkgconfig/libutf8proc.pc"

fetch zlib-1.3.1 https://github.com/madler/zlib/archive/refs/tags/v1.3.1.tar.gz
(
    cd "$SRC/zlib-1.3.1"
    CC="$CROSS-gcc" AR="$CROSS-ar" RANLIB="$CROSS-ranlib" STRIP="$CROSS-strip" \
        ./configure --static --prefix="$PREFIX"
    make -j"$JOBS"
    make install
)

fetch c-ares-1.34.4 https://github.com/c-ares/c-ares/releases/download/cares-1_34_4/c-ares-1.34.4.tar.gz
(
    cd "$SRC/c-ares-1.34.4"
    ./configure --host="$CROSS" --prefix="$PREFIX" \
        --disable-shared --enable-static --disable-tests
    make -j"$JOBS"
    make install
)

fetch mingw-libgnurx-2.5.1 http://deb.debian.org/debian/pool/main/m/mingw-libgnurx/mingw-libgnurx_2.5.1.orig.tar.gz
(
    cd "$SRC/mingw-libgnurx-2.5.1"
    ./configure --host="$CROSS" --prefix="$PREFIX"
    make -j"$JOBS" CC="$CROSS-gcc" AR="$CROSS-ar" RANLIB="$CROSS-ranlib" libgnurx.a
    cp libgnurx.a "$PREFIX/lib/"
    cp regex.h "$PREFIX/include/"
)

fetch jpeg-9f https://www.ijg.org/files/jpegsrc.v9f.tar.gz
(
    cd "$SRC/jpeg-9f"
    ./configure --host="$CROSS" --prefix="$PREFIX" --disable-shared
    make -j"$JOBS"
    make install
)

fetch libpng-1.6.46 https://download.sourceforge.net/libpng/libpng-1.6.46.tar.gz
(
    cd "$SRC/libpng-1.6.46"
    ./configure --host="$CROSS" --prefix="$PREFIX" --disable-shared
    make -j"$JOBS"
    make install
)

fetch curl-8.11.1 https://curl.se/download/curl-8.11.1.tar.gz
(
    cd "$SRC/curl-8.11.1"
    ./configure --host="$CROSS" --prefix="$PREFIX" \
        --disable-shared --enable-static --with-schannel --without-openssl \
        --without-gnutls --without-mbedtls --without-wolfssl --without-libpsl \
        --without-brotli --without-zstd --without-libidn2 --without-nghttp2 \
        --without-librtmp --without-libssh2 --without-zlib --disable-ldap \
        --disable-ldaps --disable-manual
    make -j"$JOBS"
    make install
)

make -j"$JOBS" TARGET=windows PREFIX="$PREFIX" HOST="$CROSS" \
    CC="$CROSS-gcc" CXX="$CROSS-g++" AR="$CROSS-ar" RANLIB="$CROSS-ranlib" \
    STRIP="$CROSS-strip" WINDRES="$CROSS-windres" COMMON_WARNFLAGS="-Wall"

mkdir -p "$ROOT/whatever-win64/res"
cp NetSurf.exe "$ROOT/whatever-win64/"
cp -r frontends/windows/res/. "$ROOT/whatever-win64/res/"
tar -czf "$ROOT/whatever-win64.tar.gz" -C "$ROOT" whatever-win64
