import { TextInputProps } from "react-native";

interface CampoInputProps extends TextInputProps {
    label: string;
    iconName?: string;
    isPassword?: boolean;
}

export default function CampoInput ({label, iconName, isPassword = false, style, ...rest} : CampoInputProps) {

}