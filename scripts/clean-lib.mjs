#!/usr/bin/env node
/**
 * 构建前清空 lib/（tsc 无 --clean，陈旧产物会残留在 outDir）。
 *
 * 为什么需要：`package.json` 的 files 含 lib——src 里删掉一个模块后，tsc 不会删掉它上次
 * 的产物，npm publish 会把已删代码的陈旧实现一起发出去（消费者装到"消失的模块"）。
 * 同时源码 lib ≠ 部署 lib 也会让 check:deploy 报 FAIL。
 *
 * 用法：node scripts/clean-lib.mjs   （package.json 的 "build" 在 tsc 前调用）
 */

import { rmSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'lib');

if (!existsSync(OUT)) process.exit(0);

const before = readdirSync(OUT);
rmSync(OUT, { recursive: true, force: true });
console.log(`cleaned lib/（${before.length} 个陈旧产物）`);
