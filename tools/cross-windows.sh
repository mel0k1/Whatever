#!/bin/sh
set -eu

CROSS=x86_64-w64-mingw32
ROOT="$(pwd)"
PREFIX="$ROOT/inst-win64"
BUILD_PREFIX="$ROOT/inst-native"
SRC="$ROOT/ns-src-win64"
JOBS="$(getconf _NPROCESSORS_ONLN 2>/dev/null || echo 2)"

PIN_buildsystem=0005ae300283ff01c2e2b05e7376b3e55dea21f7
PIN_nsgenbind=44c6736937ae17d4065d02959b82813b8f06a51e
PIN_libwapcaplet=c7c128d3eb3223b216c974471f82e9337fbcf4ba
PIN_libparserutils=6b0cbf086ca8eb8fe74b69f0c9ecf274eb2397ca
PIN_libnslog=bedff2146270a8a73cc265bab46ec39f9c170d07
PIN_libnspsl=82815c2bc7fd70d1b6afccfa89a9a0f3fa73db8a
PIN_libnsutils=0bd39060740b6163bd50875326654a722df97eb2
PIN_libhubbub=6651b8cf87a4aa87bcdb2ff024a02659cd3f9402
PIN_libcss=499f1c4601ad39942fd1b2204053a387bec9b989
PIN_libdom=f69781e1f062444b5af3f62d431d7d94018da53b
PIN_libnsgif=22e99eb6818b1284d0f3ff1b7f46159e87221220
PIN_libnsbmp=ea063c9f46acb43e90208da14073332b505ef7e7
PIN_utf8proc=4bfe012cb879a58a70715526e9db6a49486df571

export HOST="$CROSS"
export PREFIX
export GCCSDK_INSTALL_ENV="$PREFIX"
export PKG_CONFIG_PATH="$PREFIX/lib/pkgconfig"
export PKG_CONFIG_LIBDIR="$PREFIX/lib/pkgconfig"
export PATH="$BUILD_PREFIX/bin:$PATH"

mkdir -p "$PREFIX" "$BUILD_PREFIX" "$SRC"

dl() {
    out="$1"
    url="$2"
    alt="${3:-}"
    if [ ! -f "$out" ]; then
        n=0
        while ! curl -fsSL --retry 3 --retry-delay 5 --max-time 600 -o "$out" "$url"; do
            if [ -n "$alt" ] && curl -fsSL --retry 3 --retry-delay 5 --max-time 600 -o "$out" "$alt"; then
                break
            fi
            rm -f "$out"
            n=$((n+1))
            [ "$n" -ge 3 ] && exit 1
            sleep 10
        done
    fi
}

fetch() {
    dir="$1"
    url="$2"
    alt="${3:-}"
    if [ ! -d "$SRC/$dir" ]; then
        rm -f "$SRC/$dir.archive"
        dl "$SRC/$dir.archive" "$url" "$alt"
        tar -C "$SRC" -xf "$SRC/$dir.archive"
        rm -f "$SRC/$dir.archive"
    fi
}

clone() {
    repo="$1"
    rev="$2"
    org="${3:-netsurf-browser}"
    if [ ! -d "$SRC/$repo" ] || ! git -C "$SRC/$repo" rev-parse -q --verify HEAD >/dev/null 2>&1; then
        rm -rf "$SRC/$repo"
        git init -q "$SRC/$repo"
        n=0
        until git -C "$SRC/$repo" fetch -q --depth 1 "https://github.com/$org/$repo.git" "$rev"; do
            n=$((n+1))
            if [ "$n" -ge 3 ]; then
                rm -rf "$SRC/$repo"
                exit 1
            fi
            sleep 10
        done
        git -C "$SRC/$repo" checkout -q FETCH_HEAD
    fi
}

host_tool() {
    clone "$1" "$2"
    make -C "$SRC/$1" -j"$JOBS" install PREFIX="$BUILD_PREFIX" HOST="$(cc -dumpmachine)"
}

cross_lib() {
    clone "$1" "$2"
    make -C "$SRC/$1" -j"$JOBS" install PREFIX="$PREFIX" HOST="$CROSS" \
        CC="$CROSS-gcc" CXX="$CROSS-g++" AR="$CROSS-ar" RANLIB="$CROSS-ranlib" \
        STRIP="$CROSS-strip" WARNFLAGS="-Wall" ${3:+OPTCFLAGS="$3"}
}

autoconf_lib() {
    name="$1"
    shift
    if [ ! -f "$PREFIX/.built-$name" ]; then
        (
            cd "$SRC/$name"
            ./configure --host="$CROSS" --prefix="$PREFIX" --disable-shared "$@"
            make -j"$JOBS"
            make install
        )
        touch "$PREFIX/.built-$name"
    fi
}

if [ ! -f "$PREFIX/.built-buildsystem" ]; then
    host_tool buildsystem "$PIN_buildsystem"
    make -C "$SRC/buildsystem" install PREFIX="$PREFIX"
    touch "$PREFIX/.built-buildsystem"
fi

if [ ! -f "$BUILD_PREFIX/.built-nsgenbind" ]; then
    host_tool nsgenbind "$PIN_nsgenbind"
    touch "$BUILD_PREFIX/.built-nsgenbind"
fi

cross_lib libwapcaplet "$PIN_libwapcaplet"
cross_lib libparserutils "$PIN_libparserutils" "-DNDEBUG -O2 -DWITHOUT_ICONV_FILTER"
cross_lib libnslog "$PIN_libnslog"
cross_lib libnspsl "$PIN_libnspsl"
cross_lib libnsutils "$PIN_libnsutils"
cross_lib libhubbub "$PIN_libhubbub"
cross_lib libcss "$PIN_libcss"

fetch expat-2.6.4 https://github.com/libexpat/libexpat/releases/download/R_2_6_4/expat-2.6.4.tar.gz
autoconf_lib expat-2.6.4 --enable-static

cross_lib libdom "$PIN_libdom" "-DNDEBUG -O2 -I$PREFIX/include"
cross_lib libnsgif "$PIN_libnsgif"
cross_lib libnsbmp "$PIN_libnsbmp"

if ! grep -q winpthread "$PREFIX/lib/pkgconfig/libnsutils.pc"; then
    sed -i 's#-lnsutils#-lnsutils -lwinpthread#' "$PREFIX/lib/pkgconfig/libnsutils.pc"
fi

if [ ! -f "$PREFIX/.built-utf8proc" ]; then
    clone utf8proc "$PIN_utf8proc" JuliaStrings
    make -C "$SRC/utf8proc" -j"$JOBS" CC="$CROSS-gcc" AR="$CROSS-ar" libutf8proc.a
    cp "$SRC/utf8proc/libutf8proc.a" "$PREFIX/lib/"
    cp "$SRC/utf8proc/utf8proc.h" "$PREFIX/include/"
    mkdir -p "$PREFIX/lib/pkgconfig"
    printf 'prefix=%s\nlibdir=${prefix}/lib\nincludedir=${prefix}/include\n\nName: libutf8proc\nDescription: UTF-8 text processing library\nVersion: 2.12.0\nLibs: -L${libdir} -lutf8proc\nCflags: -DUTF8PROC_STATIC -I${includedir}\n' "$PREFIX" > "$PREFIX/lib/pkgconfig/libutf8proc.pc"
    touch "$PREFIX/.built-utf8proc"
fi

fetch zlib-1.3.1 https://github.com/madler/zlib/archive/refs/tags/v1.3.1.tar.gz
if [ ! -f "$PREFIX/.built-zlib-1.3.1" ]; then
    (
        cd "$SRC/zlib-1.3.1"
        CC="$CROSS-gcc" AR="$CROSS-ar" RANLIB="$CROSS-ranlib" STRIP="$CROSS-strip" \
            ./configure --static --prefix="$PREFIX"
        make -j"$JOBS"
        make install
    )
    touch "$PREFIX/.built-zlib-1.3.1"
fi

fetch libiconv-1.17 https://ftp.gnu.org/pub/gnu/libiconv/libiconv-1.17.tar.gz https://mirrors.kernel.org/gnu/libiconv/libiconv-1.17.tar.gz
autoconf_lib libiconv-1.17 --enable-static

fetch c-ares-1.34.4 https://github.com/c-ares/c-ares/releases/download/v1.34.4/c-ares-1.34.4.tar.gz
autoconf_lib c-ares-1.34.4 --enable-static --disable-tests

fetch mingw-libgnurx-2.5.1 https://downloads.sourceforge.net/project/mingw/Other/UserContributed/regex/mingw-regex-2.5.1/mingw-libgnurx-2.5.1-src.tar.gz
if [ ! -f "$PREFIX/.built-gnurx" ]; then
    (
        cd "$SRC/mingw-libgnurx-2.5.1"
        "$CROSS-gcc" -O2 -I. -c regex.c -o regex.o
        "$CROSS-ar" rcs libgnurx.a regex.o
        "$CROSS-ranlib" libgnurx.a
        cp libgnurx.a "$PREFIX/lib/"
        cp regex.h "$PREFIX/include/"
    )
    touch "$PREFIX/.built-gnurx"
fi

fetch jpeg-9f https://www.ijg.org/files/jpegsrc.v9f.tar.gz
autoconf_lib jpeg-9f

fetch libpng-1.6.46 https://download.sourceforge.net/libpng/libpng-1.6.46.tar.gz https://github.com/pnggroup/libpng/archive/refs/tags/v1.6.46.tar.gz
autoconf_lib libpng-1.6.46 CPPFLAGS="-I$PREFIX/include" LDFLAGS="-L$PREFIX/lib"

fetch curl-8.11.1 https://curl.se/download/curl-8.11.1.tar.gz
autoconf_lib curl-8.11.1 --enable-static --with-schannel --without-openssl \
    --without-gnutls --without-mbedtls --without-wolfssl --without-libpsl \
    --without-brotli --without-zstd --without-libidn2 --without-nghttp2 \
    --without-librtmp --without-libssh2 --with-zlib="$PREFIX" --disable-ldap \
    --disable-ldaps --disable-manual CPPFLAGS="-I$PREFIX/include" LDFLAGS="-L$PREFIX/lib"

if ! grep -q -- '-lz' "$PREFIX/lib/pkgconfig/libcurl.pc"; then
    sed -i 's/^Libs: \(.*\)$/Libs: \1 -lz/' "$PREFIX/lib/pkgconfig/libcurl.pc"
fi

make -j"$JOBS" TARGET=windows PREFIX="$PREFIX" HOST="$CROSS" \
    CC="$CROSS-gcc" CXX="$CROSS-g++" AR="$CROSS-ar" RANLIB="$CROSS-ranlib" \
    STRIP="$CROSS-strip" WINDRES="$CROSS-windres" COMMON_WARNFLAGS="-Wall" \
    NETSURF_USE_LIBICONV_PLUG=NO

test -f NetSurf.exe
test "$(head -c 2 NetSurf.exe)" = "MZ"
"$CROSS-strip" NetSurf.exe

make -j"$JOBS" TARGET=windows PREFIX="$PREFIX" HOST="$CROSS" \
    CC="$CROSS-gcc" CXX="$CROSS-g++" AR="$CROSS-ar" RANLIB="$CROSS-ranlib" \
    STRIP="$CROSS-strip" WINDRES="$CROSS-windres" COMMON_WARNFLAGS="-Wall" \
    NETSURF_USE_LIBICONV_PLUG=NO whatever-win64-setup.exe
test -s whatever-win64-setup.exe

rm -rf "$ROOT/whatever-win64"
mkdir -p "$ROOT/whatever-win64/res"
cp NetSurf.exe "$ROOT/whatever-win64/NetSurf.exe"
cp -r frontends/windows/res/. "$ROOT/whatever-win64/res/"

printf 'Whatever browser, experimental Windows build.\r\nKeep the res folder next to NetSurf.exe.\r\n\r\nWhatever, экспериментальная сборка для Windows.\r\nДержите папку res рядом с NetSurf.exe.\r\n' > "$ROOT/whatever-win64/README.txt"

"$CROSS-objdump" -p "$ROOT/whatever-win64/NetSurf.exe" | awk '/DLL Name/ {print $3}' | sort -u | while read -r dll; do
    src_dll="$(find "/usr/$CROSS" -name "$dll" -type f 2>/dev/null | head -n 1)"
    if [ -n "$src_dll" ]; then
        cp "$src_dll" "$ROOT/whatever-win64/"
    fi
done

rm -f "$ROOT/whatever-win64.zip"
(cd "$ROOT" && zip -q -r -9 whatever-win64.zip whatever-win64)
test -s "$ROOT/whatever-win64.zip"
