import { describe, expect, it } from 'vitest'
import {
  maskCpf,
  maskData,
  maskInteiro,
  maskMoeda,
  maskTelefone,
  moedaParaInput,
  parseMoeda,
} from './masks'

describe('maskMoeda / parseMoeda', () => {
  it('formata dígitos como BRL sem símbolo', () => {
    expect(maskMoeda('123456')).toBe('1.234,56')
    expect(maskMoeda('5')).toBe('0,05')
    expect(maskMoeda('100')).toBe('1,00')
    expect(maskMoeda('1000000')).toBe('10.000,00')
  })

  it('vazio permanece vazio (permite campo opcional em branco)', () => {
    expect(maskMoeda('')).toBe('')
    expect(maskMoeda('abc')).toBe('')
  })

  it('descarta zeros à esquerda acumulados durante a digitação', () => {
    expect(maskMoeda('0025000')).toBe('250,00')
    expect(maskMoeda('0025')).toBe('0,25')
    expect(maskMoeda('000')).toBe('0,00')
  })

  it('ignora caracteres não numéricos', () => {
    expect(maskMoeda('R$1a2b3')).toBe('1,23')
  })

  it('parseMoeda é o inverso', () => {
    expect(parseMoeda('1.234,56')).toBe(1234.56)
    expect(parseMoeda('0,05')).toBe(0.05)
    expect(parseMoeda('')).toBe(0)
    expect(parseMoeda(maskMoeda('987654'))).toBe(9876.54)
  })

  it('moedaParaInput formata número para edição', () => {
    expect(moedaParaInput(1234.5)).toBe('1.234,50')
    expect(moedaParaInput(0)).toBe('0,00')
  })
})

describe('maskTelefone', () => {
  it('celular (11 dígitos)', () => {
    expect(maskTelefone('11987654321')).toBe('(11) 98765-4321')
  })
  it('fixo (10 dígitos)', () => {
    expect(maskTelefone('1132104567')).toBe('(11) 3210-4567')
  })
  it('parcial', () => {
    expect(maskTelefone('1198')).toBe('(11) 98')
    expect(maskTelefone('')).toBe('')
  })
})

describe('maskCpf', () => {
  it('formata 11 dígitos', () => {
    expect(maskCpf('12345678901')).toBe('123.456.789-01')
  })
  it('trunca além de 11', () => {
    expect(maskCpf('12345678901999')).toBe('123.456.789-01')
  })
})

describe('maskData', () => {
  it('formata DD/MM/AAAA', () => {
    expect(maskData('09102026')).toBe('09/10/2026')
    expect(maskData('091')).toBe('09/1')
  })
})

describe('maskInteiro', () => {
  it('mantém só dígitos', () => {
    expect(maskInteiro('1a2b3')).toBe('123')
    expect(maskInteiro('12.5')).toBe('125')
  })
})
