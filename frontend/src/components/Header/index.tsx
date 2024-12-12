import { Container, HeaderText, SecondaryButton } from "./index.style";

interface IProps {
  title: String;
  buttonTitle?: String;
  onButtonClick?: () => void;
}

const Header = ({ title, buttonTitle, onButtonClick }: IProps) => {
  return (
    <Container>
      <HeaderText>{title}</HeaderText>
      {buttonTitle && (
        <SecondaryButton onClick={onButtonClick}>{buttonTitle}</SecondaryButton>
      )}
    </Container>
  );
};

export default Header;
