import React from 'react'
import styles from '../index.module.scss'
import { PlusCircleOutlined } from '@ant-design/icons'
import { MYKNOWLEDGE } from '@/lib/ defines'

type Props = {
  onClick?: () => void;
}

export default function CreateCard({ onClick }: Props) {
  return (
    <div className={styles['create-card']} onClick={onClick}>
      <PlusCircleOutlined className='fs-18' />
      <span className='fs-18 ml-8'>{MYKNOWLEDGE.CREATE_CARD_TITLE}</span>
    </div>
  )
}