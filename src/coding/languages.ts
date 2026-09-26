import type { JudgeLanguage } from '@/shared/types'

/**
 * 풀이 화면의 언어 목록과 처음 코드. 브라우저에서 쓰는 쪽이라 채점 명령(service/judge.ts)과 따로 둔다 —
 * 언어를 늘리면 두 곳과 채점 서버 이미지를 함께 고친다. note의 버전은 채점 서버 이미지에 설치된 것이다.
 */
interface LanguageOption {
  id: JudgeLanguage
  label: string
  /** 편집기 탭에 보이는 파일 이름. 채점 서버가 저장하는 이름(service/judge.ts)과 같다. */
  fileName: string
  /** 편집기 위에 한 줄로 보여 줄 실행 환경과 주의점. */
  note: string
  template: string
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    id: 'python',
    label: 'Python',
    fileName: 'main.py',
    note: 'Python 3.13',
    template: `import sys
input = sys.stdin.readline

`,
  },
  {
    id: 'javascript',
    label: 'JavaScript',
    fileName: 'main.js',
    note: 'Node.js 24',
    template: `const input = require('fs').readFileSync(0, 'utf8').trimEnd().split('\\n')

`,
  },
  {
    id: 'typescript',
    label: 'TypeScript',
    fileName: 'main.ts',
    note: 'Node.js 24 — 타입 검사 없이 타입만 지우고 실행합니다',
    template: `import { readFileSync } from 'node:fs'

const input: string[] = readFileSync(0, 'utf8').trimEnd().split('\\n')

`,
  },
  {
    id: 'java',
    label: 'Java',
    fileName: 'Main.java',
    note: 'OpenJDK 21 — 클래스 이름은 Main이어야 합니다',
    template: `import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));

    }
}
`,
  },
  {
    id: 'kotlin',
    label: 'Kotlin',
    fileName: 'Main.kt',
    note: 'Kotlin 2.4 (JVM) — 컴파일에 몇 초 걸립니다',
    template: `import java.io.BufferedReader
import java.io.InputStreamReader

fun main() {
    val reader = BufferedReader(InputStreamReader(System.\`in\`))

}
`,
  },
  {
    id: 'cpp',
    label: 'C++',
    fileName: 'main.cpp',
    note: 'GCC 14 · g++ -O2 -std=c++20',
    template: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    return 0;
}
`,
  },
  {
    id: 'c',
    label: 'C',
    fileName: 'main.c',
    note: 'GCC 14 · gcc -O2 -std=c17',
    template: `#include <stdio.h>

int main(void) {

    return 0;
}
`,
  },
  {
    id: 'go',
    label: 'Go',
    fileName: 'main.go',
    note: 'Go 1.24 — 컴파일에 몇 초 걸립니다',
    template: `package main

import (
	"bufio"
	"fmt"
	"os"
)

func main() {
	reader := bufio.NewReader(os.Stdin)
	writer := bufio.NewWriter(os.Stdout)
	defer writer.Flush()

	_ = reader
	fmt.Fprintln(writer)
}
`,
  },
  {
    id: 'ruby',
    label: 'Ruby',
    fileName: 'main.rb',
    note: 'Ruby 3.3',
    template: `lines = STDIN.read.split("\\n")

`,
  },
]

export const DEFAULT_LANGUAGE: JudgeLanguage = 'python'

export function findLanguageOption(language: JudgeLanguage): LanguageOption {
  return LANGUAGE_OPTIONS.find((option) => option.id === language) ?? (LANGUAGE_OPTIONS[0] as LanguageOption)
}
