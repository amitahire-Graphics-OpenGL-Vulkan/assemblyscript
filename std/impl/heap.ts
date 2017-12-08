/// <reference path="../../assembly.d.ts" />

const ALIGN_LOG2: usize = 3;
const ALIGN_SIZE: usize = 1 << ALIGN_LOG2;
const ALIGN_MASK: usize = ALIGN_SIZE - 1;

let HEAP_OFFSET: usize = HEAP_START; // HEAP_START is a constant generated by the compiler

@global()
@struct()
class Heap {

  static allocate(size: usize): usize {
    const ptr: usize = HEAP_OFFSET;
    assert(ptr + size <= (<usize>current_memory() << 16));
    if (((HEAP_OFFSET += size) & ALIGN_MASK) != 0) // align next offset
      HEAP_OFFSET = (HEAP_OFFSET | ALIGN_MASK) + 1;
    return ptr;
  }

  static dispose(ptr: usize): void {
    // just a big chunk of non-disposable memory for now
  }

  static get used(): usize {
    return HEAP_OFFSET - HEAP_START;
  }

  static get free(): usize {
    return (<usize>current_memory() << 16) - HEAP_OFFSET;
  }

  static get size(): usize {
    return (<usize>current_memory() << 16) - HEAP_START;
  }

  static copy(dest: usize, src: usize, n: usize): usize {
    assert(dest >= HEAP_START);

    // the following is based on musl's implementation of memcpy
    let dst: usize = dest;
    let w: u32, x: u32;

    // copy 1 byte each until src is aligned to 4 bytes
    while (n && src % 4) {
      store<u8>(dst++, load<u8>(src++));
      n--;
    }

    // if dst is aligned to 4 bytes as well, copy 4 bytes each
    if (dst % 4 == 0) {
      while (n >= 16) {
        store<u32>(dst     , load<u32>(src     ));
        store<u32>(dst +  4, load<u32>(src +  4));
        store<u32>(dst +  8, load<u32>(src +  8));
        store<u32>(dst + 12, load<u32>(src + 12));
        src += 16; dst += 16; n -= 16;
      }
      if (n & 8) {
        store<u32>(dst    , load<u32>(src    ));
        store<u32>(dst + 4, load<u32>(src + 4));
        dst += 8; src += 8;
      }
      if (n & 4) {
        store<u32>(dst, load<u32>(src));
        dst += 4; src += 4;
      }
      if (n & 2) { // drop to 2 bytes each
        store<u16>(dst, load<u16>(src));
        dst += 2; src += 2;
      }
      if (n & 1) { // drop to 1 byte
        store<u8>(dst++, load<u8>(src++));
      }
      return dest;
    }

    // if dst is not aligned to 4 bytes, use alternating shifts to copy 4 bytes each
    // doing shifts if faster when copying enough bytes (here: 32 or more)
    if (n >= 32) {
      switch (dst % 4) {
        // known to be != 0
        case 1:
          w = load<u32>(src);
          store<u8>(dst++, load<u8>(src++));
          store<u8>(dst++, load<u8>(src++));
          store<u8>(dst++, load<u8>(src++));
          n -= 3;
          while (n >= 17) {
            x = load<u32>(src + 1);
            store<u32>(dst, w >> 24 | x << 8);
            w = load<u32>(src + 5);
            store<u32>(dst + 4, x >> 24 | w << 8);
            x = load<u32>(src + 9);
            store<u32>(dst + 8, w >> 24 | x << 8);
            w = load<u32>(src + 13);
            store<u32>(dst + 12, x >> 24 | w << 8);
            src += 16; dst += 16; n -= 16;
          }
          break;
        case 2:
          w = load<u32>(src);
          store<u8>(dst++, load<u8>(src++));
          store<u8>(dst++, load<u8>(src++));
          n -= 2;
          while (n >= 18) {
            x = load<u32>(src + 2);
            store<u32>(dst, w >> 16 | x << 16);
            w = load<u32>(src + 6);
            store<u32>(dst + 4, x >> 16 | w << 16);
            x = load<u32>(src + 10);
            store<u32>(dst + 8, w >> 16 | x << 16);
            w = load<u32>(src + 14);
            store<u32>(dst + 12, x >> 16 | w << 16);
            src += 16; dst += 16; n -= 16;
          }
          break;
        case 3:
          w = load<u32>(src);
          store<u8>(dst++, load<u8>(src++));
          n -= 1;
          while (n >= 19) {
            x = load<u32>(src + 3);
            store<u32>(dst, w >> 8 | x << 24);
            w = load<u32>(src + 7);
            store<u32>(dst + 4, x >> 8 | w << 24);
            x = load<u32>(src + 11);
            store<u32>(dst + 8, w >> 8 | x << 24);
            w = load<u32>(src + 15);
            store<u32>(dst + 12, x >> 8 | w << 24);
            src += 16; dst += 16; n -= 16;
          }
          break;
      }
    }

    // copy remaining bytes one by one
    if (n & 16) {
      store<u8>(dst++, load<u8>(src++));
      store<u8>(dst++, load<u8>(src++));
      store<u8>(dst++, load<u8>(src++));
      store<u8>(dst++, load<u8>(src++));
      store<u8>(dst++, load<u8>(src++));
      store<u8>(dst++, load<u8>(src++));
      store<u8>(dst++, load<u8>(src++));
      store<u8>(dst++, load<u8>(src++));
      store<u8>(dst++, load<u8>(src++));
      store<u8>(dst++, load<u8>(src++));
      store<u8>(dst++, load<u8>(src++));
      store<u8>(dst++, load<u8>(src++));
      store<u8>(dst++, load<u8>(src++));
      store<u8>(dst++, load<u8>(src++));
      store<u8>(dst++, load<u8>(src++));
      store<u8>(dst++, load<u8>(src++));
    }
    if (n & 8) {
      store<u8>(dst++, load<u8>(src++));
      store<u8>(dst++, load<u8>(src++));
      store<u8>(dst++, load<u8>(src++));
      store<u8>(dst++, load<u8>(src++));
      store<u8>(dst++, load<u8>(src++));
      store<u8>(dst++, load<u8>(src++));
      store<u8>(dst++, load<u8>(src++));
      store<u8>(dst++, load<u8>(src++));
    }
    if (n & 4) {
      store<u8>(dst++, load<u8>(src++));
      store<u8>(dst++, load<u8>(src++));
      store<u8>(dst++, load<u8>(src++));
      store<u8>(dst++, load<u8>(src++));
    }
    if (n & 2) {
      store<u8>(dst++, load<u8>(src++));
      store<u8>(dst++, load<u8>(src++));
    }
    if (n & 1) {
      store<u8>(dst++, load<u8>(src++));
    }
    return dest;
  }

  private constructor() {}
}
