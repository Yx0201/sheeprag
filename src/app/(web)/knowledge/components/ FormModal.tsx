import React from 'react';
import { Modal } from 'antd';
type Props = {
  isModalOpen: boolean;
  handleOk: () => void;
  handleCancel: () => void;
}
const FormModal: React.FC<Props> = ({ isModalOpen=false, handleOk = () => {}, handleCancel = () => {} }) => {
  return (
    <>
      <Modal
        title="Create Knowledge"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        width={800}
      >
        <p>Some contents...</p>
      </Modal>
    </>
  );
};

export default FormModal;